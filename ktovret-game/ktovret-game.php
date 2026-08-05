<?php
/**
 * Plugin Name: Кто врёт? — игровой движок
 * Description: SEO-страницы расследований, мобильный игровой интерфейс и локальное сохранение прогресса.
 * Version: 0.1.0
 * Author: Valeriy
 * Text Domain: ktovret-game
 */
declare(strict_types=1);
if (!defined('ABSPATH')) { exit; }

final class KtoVret_Game_Plugin {
    private const VERSION = '0.1.0';
    private const POST_TYPE = 'ktv_case';
    private const META_KEY = '_ktv_case_json';
    private static bool $assets_enqueued = false;

    public static function boot(): void {
        add_action('init', [self::class, 'register_case_type']);
        add_action('init', [self::class, 'register_case_meta']);
        add_shortcode('ktovret_game', [self::class, 'shortcode']);
        add_filter('the_content', [self::class, 'single_content']);
        add_filter('body_class', [self::class, 'body_class']);
    }

    public static function activate(): void {
        self::register_case_type(); self::register_case_meta(); self::seed(); flush_rewrite_rules();
    }
    public static function deactivate(): void { flush_rewrite_rules(); }

    public static function register_case_type(): void {
        register_post_type(self::POST_TYPE, [
            'labels' => ['name'=>'Расследования','singular_name'=>'Расследование','add_new_item'=>'Добавить расследование','edit_item'=>'Редактировать расследование','view_item'=>'Открыть расследование'],
            'public'=>true,'show_in_rest'=>true,'menu_icon'=>'dashicons-search','supports'=>['title','editor','excerpt','thumbnail'],
            'has_archive'=>'dela','rewrite'=>['slug'=>'delo','with_front'=>false],'publicly_queryable'=>true,'exclude_from_search'=>false,
        ]);
    }

    public static function register_case_meta(): void {
        register_post_meta(self::POST_TYPE, self::META_KEY, [
            'type'=>'string','single'=>true,'show_in_rest'=>true,
            'sanitize_callback'=>[self::class,'sanitize_json'],
            'auth_callback'=>static fn(): bool => current_user_can('edit_posts'),
        ]);
    }

    public static function sanitize_json(string $value): string {
        $data=json_decode($value,true);
        return is_array($data)&&!empty($data['id'])&&!empty($data['title'])
            ? wp_json_encode($data,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES) : '';
    }

    public static function body_class(array $classes): array {
        if(is_singular(self::POST_TYPE)){$classes[]='ktv-case-page';} return $classes;
    }

    public static function single_content(string $content): string {
        if(!is_singular(self::POST_TYPE)||!in_the_loop()||!is_main_query()){return $content;}
        return self::render((int)get_the_ID());
    }

    public static function shortcode(array $atts=[]): string {
        $atts=shortcode_atts(['id'=>0,'slug'=>''],$atts,'ktovret_game');
        $id=absint($atts['id']);
        if(!$id&&$atts['slug']){$post=get_page_by_path(sanitize_title($atts['slug']),OBJECT,self::POST_TYPE);$id=$post instanceof WP_Post?(int)$post->ID:0;}
        if(!$id&&is_singular(self::POST_TYPE)){$id=(int)get_the_ID();}
        return $id?self::render($id):'<p>Расследование не найдено.</p>';
    }

    private static function render(int $id): string {
        if(get_post_type($id)!==self::POST_TYPE){return '<p>Расследование не найдено.</p>';}
        $case=json_decode((string)get_post_meta($id,self::META_KEY,true),true);
        if(!is_array($case)){return '<p>Данные расследования повреждены.</p>';}
        if(!self::$assets_enqueued){
            $base=plugin_dir_url(__FILE__).'assets/';
            wp_enqueue_style('ktovret-game',$base.'style.css',[],self::VERSION);
            wp_enqueue_script('ktovret-game',$base.'app.js',[],self::VERSION,true);
            self::$assets_enqueued=true;
        }
        wp_localize_script('ktovret-game','KtoVretWeb',[
            'case'=>$case,'storageKey'=>'ktovret:web:v1:'.sanitize_key((string)$case['id']),
            'permalink'=>get_permalink($id),'siteName'=>get_bloginfo('name')?:'Кто врёт?'
        ]);
        return sprintf('<main class="ktv-game-shell" data-ktv-root data-case-id="%s"><noscript>Для прохождения расследования включите JavaScript.</noscript></main>',esc_attr((string)$case['id']));
    }

    private static function seed(): void {
        if(get_page_by_path('zapis-do-vskrytiya-konteynera',OBJECT,self::POST_TYPE) instanceof WP_Post){return;}
        $case=self::first_case();
        $id=wp_insert_post([
            'post_type'=>self::POST_TYPE,'post_status'=>'publish','post_title'=>$case['title'],
            'post_name'=>'zapis-do-vskrytiya-konteynera',
            'post_excerpt'=>'Найдите деталь, которую свидетель не мог узнать из общего экрана.',
            'post_content'=>$case['intro'],
        ],true);
        if(!is_wp_error($id)){update_post_meta((int)$id,self::META_KEY,wp_json_encode($case,JSON_UNESCAPED_UNICODE|JSON_UNESCAPED_SLASHES));}
    }

    private static function first_case(): array {
        return [
            'id'=>'volume1_066','title'=>'Запись до вскрытия контейнера','difficulty'=>'Сложное','category'=>'Кто мог это знать?','logicType'=>'Границы знания','materialsLabel'=>'Материалы дела',
            'intro'=>"В 19:00 на круглом стеллаже стояли контейнеры: секция 1 — красный, 2 — синий, 3 — белый, 4 — чёрный. В 19:05 и 19:10 стеллаж сделал по одному повороту по часовой стрелке: содержимое 1 переходило в 2, 2 — в 3, 3 — в 4, 4 — в 1. В 19:12 открыли секцию №4, после чего один контейнер исчез.\n\nНа общем экране были видны исходная схема, два поворота, открытие секции №4 и запись западного датчика: в 19:15 через выход пронесли груз массой 4 кг. Массы: красный — 3 кг, синий — 4 кг, белый — 5 кг, чёрный — 6 кг. Содержимое контейнеров на экране не показывалось.\n\nВ 19:18 Роман записал: «В хранилище я не заходил. Всё восстановил по общему экрану. Исчез синий контейнер. Его вынули в 19:12, затем пронесли через западный выход. Внутри был пакет К-17». Синий контейнер впервые вскрыли в 19:42; внутри действительно был К-17. До вскрытия маркировка нигде не публиковалась.",
            'question'=>'Какой фрагмент доказывает, что Роман солгал об источнике знания?',
            'characters'=>[['id'=>'roman','name'=>'Роман','role'=>'сотрудник','statement'=>'Всё восстановил по общему экрану: исчез синий контейнер, его вынули в 19:12, пронесли через западный выход, внутри был пакет К-17.']],
            'answerStages'=>[['id'=>'fragment','prompt'=>'Выберите разоблачающий фрагмент','instruction'=>'Отметьте деталь, которую невозможно вывести из опубликованных данных.','selectionMode'=>'single','options'=>[
                ['id'=>'blue','label'=>'«Исчез синий контейнер»'],['id'=>'time','label'=>'«Его вынули в 19:12»'],['id'=>'exit','label'=>'«Пронесли через западный выход»'],['id'=>'k17','label'=>'«Внутри был пакет К-17»']],
                'correctOptionIds'=>['k17']]],
            'explanation'=>[
                'shortReason'=>'Маркировку К-17 нельзя было вывести из общедоступных данных.',
                'fullReason'=>'Два поворота помещают синий контейнер в секцию №4; время открытия дано журналом, а масса 4 кг связывает контейнер с западным выходом. Но номер внутреннего пакета оставался физически скрыт до вскрытия в 19:42. Роман назвал его в 19:18, поэтому его факты верны, а объяснение источника знания — нет.',
                'reasoningSteps'=>['После двух поворотов в секции №4 оказывается синий контейнер.','Время и западный выход выводятся из журнала и таблицы масс.','Маркировка К-17 до 19:42 была недоступна, но прозвучала в записи 19:18.'],
                'evidenceFragments'=>[['sourceId'=>'roman','quote'=>'Внутри был пакет К-17'],['sourceId'=>'intro','quote'=>'впервые вскрыли в 19:42']]
            ]
        ];
    }
}
register_activation_hook(__FILE__,[KtoVret_Game_Plugin::class,'activate']);
register_deactivation_hook(__FILE__,[KtoVret_Game_Plugin::class,'deactivate']);
KtoVret_Game_Plugin::boot();
