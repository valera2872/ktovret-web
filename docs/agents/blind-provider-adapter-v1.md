# Blind Provider Adapter Contract v1

The corpus layer does not call a model vendor directly.

`run-blind-provider.mjs` calls an HTTP adapter that receives:

```json
{
  "schema_version": "blind_provider_request_v1",
  "request_id": "...",
  "prompt_contract": {
    "...": "generated from blind_player_packet_v1 only"
  }
}
```

The adapter returns either a checkpoint object directly or:

```json
{
  "checkpoint": {
    "stage": 1,
    "theories": [],
    "established_facts": [],
    "unresolved_questions": [],
    "next_action": "...",
    "confusion": [],
    "reasoning_mode": "inference",
    "notes": ""
  }
}
```

Environment:
- `BLIND_INVESTIGATOR_ENDPOINT` — adapter URL;
- `BLIND_INVESTIGATOR_TOKEN` — optional bearer token.

The caller MUST NOT put Private CANON, culprit, reveal, supports/weakens, evidence reliability or author notes into environment variables intended for forwarding.

The runner validates every provider response against the current player packet and rejects references to unavailable evidence.

Provider/vendor-specific API conversion belongs behind the adapter, not inside Case Architect.
