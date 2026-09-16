export type P17FinalAnswers={
  who:string;
  mechanism:string;
  phone:string;
  office:string;
  motive:string;
  lies:string;
};

export type P17FinalBreakdown={
  key:keyof P17FinalAnswers;
  label:string;
  points:number;
  max:number;
  ok:boolean;
  feedback:string;
};

const clean=(value:unknown,max=1600)=>String(value||'')
  .replace(/[\u0000-\u001f\u007f]/g,' ')
  .replace(/\s+/g,' ')
  .trim()
  .slice(0,max);

const norm=(value:string)=>value.toLowerCase().replace(/ё/g,'е');
const has=(text:string,re:RegExp)=>re.test(norm(text));

export function sanitizeP17FinalAnswers(raw:unknown):P17FinalAnswers{
  const x=raw&&typeof raw==='object'&&!Array.isArray(raw)?raw as Record<string,unknown>:{};
  return{
    who:clean(x.who),
    mechanism:clean(x.mechanism),
    phone:clean(x.phone),
    office:clean(x.office),
    motive:clean(x.motive),
    lies:clean(x.lies),
  };
}

export function evaluateP17Final(a:P17FinalAnswers){
  const breakdown:P17FinalBreakdown[]=[];

  const whoPerson=has(a.who,/(орлов|павел)/);
  const whoSelf=has(a.who,/(сам|инсцен|сплан|организ|сымит|устроил|добровольн|исчез)/);
  const whoPoints=(whoPerson?7:0)+(whoSelf?8:0);
  breakdown.push({key:'who',label:'Кто организовал исчезновение',points:whoPoints,max:15,ok:whoPoints>=13,feedback:whoPoints>=13?'Верно: исчезновение было действием самого Орлова.':'Нужно определить не только человека, но и был ли он жертвой или автором исчезновения.'});

  const mechStop=has(a.mechanism,/(к-?17|техническ.{0,10}останов|техническ.{0,10}пост)/);
  const mechDoor=has(a.mechanism,/(служебн.{0,12}двер|задн.{0,12}двер|двер.{0,12}вагон|тамбур)/);
  const mechLeave=has(a.mechanism,/(выш|сош|покин|выбрал|ушел|ушёл)/);
  const mechRoad=has(a.mechanism,/(машин|автомоб|служебн.{0,10}дорог|35\s*м|шлагбаум|подобрал)/);
  const mechPoints=(mechStop?6:0)+(mechDoor?6:0)+(mechLeave?5:0)+(mechRoad?3:0);
  breakdown.push({key:'mechanism',label:'Как Орлов покинул поезд',points:mechPoints,max:20,ok:mechPoints>=17,feedback:mechPoints>=17?'Механизм выхода реконструирован.':'Нужна связка: место/время остановки → физически доступный выход → уход с поезда.'});

  const phoneLeft=has(a.phone,/(остав|оставил|брос|не взял|остался|оставлен)/)&&has(a.phone,/(телефон|смартфон|мобильн)/);
  const phoneTrain=has(a.phone,/(поезд|вагон|купе|зарядк)/);
  const phoneDevice=has(a.phone,/(устройств|не человек|не владел|геолокац|местоположен)/);
  const phonePoints=(phoneLeft?7:0)+(phoneTrain?5:0)+(phoneDevice?3:0);
  breakdown.push({key:'phone',label:'Почему телефон продолжал ехать',points:phonePoints,max:15,ok:phonePoints>=12,feedback:phonePoints>=12?'Верно: телефон был частью ложного цифрового следа.':'Разделите местоположение устройства и местоположение Орлова.'});

  const officeOrlov=has(a.office,/(орлов|павел|сам)/);
  const officeAuth=has(a.office,/(пропуск|идентификатор|карта|pin|пин|код)/);
  const officeNoDouble=has(a.office,/(не двойник|не подмен|лично|сам|без двойник)/);
  const officePoints=(officeOrlov?4:0)+(officeAuth?4:0)+(officeNoDouble?2:0);
  breakdown.push({key:'office',label:'Кто был в офисе в 00:58',points:officePoints,max:10,ok:officePoints>=8,feedback:officePoints>=8?'Верно: данные доступа согласуются с личным визитом Орлова.':'Нужно объяснить, почему идентификатор и персональный PIN важнее версии о случайном использовании пропуска.'});

  const motiveAudit=has(a.motive,/(audit-?3|аудит|проверк|отчет|отчёт)/);
  const motiveRemove=has(a.motive,/(забрать|украст|изъят|убрат|удал|скрыт|уничтож|не допустить|сорват)/);
  const motiveVector=has(a.motive,/(вектор-?м|мельников|подрядчик|платеж|платёж)/);
  const motiveMorning=has(a.motive,/(09:00|9:00|утр|независим.{0,10}аудитор|передач)/);
  const motivePoints=(motiveAudit?8:0)+(motiveRemove?7:0)+(motiveVector?6:0)+(motiveMorning?4:0);
  breakdown.push({key:'motive',label:'Зачем понадобилось исчезновение',points:motivePoints,max:25,ok:motivePoints>=20,feedback:motivePoints>=20?'Мотив и временное давление восстановлены.':'Нужно связать ночной визит в архив с конкретным документом, его содержанием и тем, что должно было произойти утром.'});

  const lazName=has(a.lies,/(лазарев|проводник)/);
  const lazWhy=has(a.lies,/(кур|взыскан|работ|уволь|отстран|служебн)/);
  const marinaName=has(a.lies,/(марин|жена|супруг)/);
  const marinaWhy=has(a.lies,/(развод|отношен|расстав|подозре|подозр|боял|страх)/);
  const notAccomplice=has(a.lies,/(не сообщник|не участ|не помог|не причаст|не связан.{0,15}исчез|ложь.{0,12}не.*вина)/);
  const liePoints=(lazName&&lazWhy?6:0)+(marinaName&&marinaWhy?6:0)+(notAccomplice?3:0);
  breakdown.push({key:'lies',label:'Какие лжи не означают соучастие',points:liePoints,max:15,ok:liePoints>=12,feedback:liePoints>=12?'Верно: обе побочные лжи объяснены отдельно от плана Орлова.':'Нужно разобрать ложь Лазарева и Марины по отдельности: что каждый скрывал и почему это не делает их сообщниками.'});

  const score=breakdown.reduce((sum,item)=>sum+item.points,0);
  const verdict=score>=90?'Точная реконструкция':score>=70?'Дело раскрыто':score>=45?'Основная версия близка':'Реконструкция пока не сходится';
  return{
    score,
    verdict,
    breakdown,
    solved:score>=70,
    debrief:{
      timeline:[
        '23:46 — Орлов садится в поезд №142.',
        '23:55 — Воронина видит его в вагоне после отправления.',
        '00:08:47 — поезд останавливается на техническом посту К-17.',
        '00:09:21–00:10:02 — Лазарев открывает служебную дверь и выходит покурить.',
        'Орлов использует открытый выход и покидает поезд, оставив основной телефон и вещи в купе.',
        '00:16:04 — со служебной дороги К-17 уезжает автомобиль с водителем и пассажиром.',
        '00:58 — Орлов входит в «НордПроект» своим идентификатором и PIN.',
        '01:01 — открыт шкаф AUDIT; бумажный AUDIT-3 исчезает.',
        '01:18 — отсутствие Орлова обнаруживают в поезде, а его телефон всё ещё едет по маршруту.'
      ],
      conclusion:'Орлов инсценировал собственное исчезновение как алиби, чтобы покинуть поезд на К-17, добраться до офиса и забрать AUDIT-3 до его передачи независимым аудиторам. Лазарев скрыл курение и служебную дверь из страха за работу; Марина скрыла развод из страха оказаться подозреваемой. Их ложь не делает их сообщниками.',
    },
  };
}
