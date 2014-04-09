define(function(require){
  var samples = [
    {
      id: 'FeelTheBeat:beat',
      base64: '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eW0fRc9FTEFNRVVVFAAQADdj3d/8O1AB9f///////+n/2f/79XaxPcj/+xBkmINwcglKIgBJmAHASSAA4AEB1CEoh4GkaA6BZhABBAT/LRqAJNYMhu8rhs/df//////////1Sn/+52af6X/p0qUkAAAAmAYN3VBJf/+7/////zUz939/fOuF5Wz/4u5nuneYvP/7EGSpA3BvCEih4HkqBIBZJQDhAYFcHyMIAKRgDQFj1AeEBpDRhgCAXAQn8vAbtvav///////3fstMf33HW7uybW7276hsXKdqRt1aTEFNRTMuOTkuNaqqqqqqqhQACABZG4u6HBP///sQZLqDcGUHSEHgSSoG4FjoAwEBAZAdKIA84CgGgSQABIAE///////////93r75UQgAAAVhJ7+pAv////////////9dTEFNRTMuOTkuNVVVMAAAAG0CB64FIJGWi7/////f+3/j9CP/+xBky4PwWQfIogBJKAHASPABIAEBWB0hDADkYAaBI8AEgAT9Gu+pX+QDeVbVSyjtSxseTcqBf////////////////61MQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVMAAAAIYQ71Qb///7EGTgg/BXB8fCQDkoD6BI0AEhAAD4Hx6ogERgLoFiwAaEAP///////////9WBYVpn/////////+7/7uv3/+n/pTUiCExBTUUzLjk5LjWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqQAAE//sQZOuD8F0HRsIAOSgOwEiwAaAAARAdGqBgoCAFgSQAA4AEUnA5AwvZ////////////Z///i0J////////////////TTEFNRTMuOTkuNVWACb9v///////////qT+9X+2n7vrhf////+xBk+gPwNgLHKBAQCBTASKABgAAA8B0jCQBEoFaBIoAFgAD//////////////0yLPR/////////////6natv/e7QiWVMwJfZ////////HV//27Xt/9LsdV5Cvpjf///////////////7EGT8g/BRB8egGBAIFcBIoAEgAADgCRqgvAAgWoFigAWEAP/p0aA5+3//////Szq/6qkff/sfs9N9KXOetuiVZofpi2hz///////6//+z//+yj9f9fdfrhL///////q//+///ZU70//sQZP+D8EMCSMAYAAwdAFiQAUEAAOAJIQA8ACB9AWJABYQAf29G7o0IoC/////////////2//+r2/1w3///////////0ExBTUUzLjk5LjWqqqqqqqqqqqqqqqqqqqqqcE9v////////+xBk84PwQgJIIBgACA9ASMAAwAABCAkggGAAIC+BYwACgAD///0/R/192j/+uBP//////////070R3tV+j//R2aoWXpMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7EGT5h/A+AkdADwAIASBI4ABAAQQECxIAPCAAOwFjAAKABKqqqqqqqqqqqqqqqqBUwL7f///////v///t////1dfpokxBTUUzLjk5LjWqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq//sQZPMH8D0CR0APAAgMQEjQAKAAArwLFAA8IAAEgSMAAoAEqqqqhv///////////6f//1T/////////////////1xFVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBk74fwIwLHKA0ICAEgSMAAQAECFAsYACwgADcBY0ABAABVVVVVVVVVVVVVVVVVVVVVl4L/////////////////6qVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGT6D/CkAsUADAgADyBIwABAAQJ8CRYALAAABAAkAAAABFVVVVVVVVVVVVVVVVVVVVVVVZWiK//////////////+hUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZP8P8LQCxQAMAAAOYFjQAEAAA6QLEgAwIAAEASMAAQAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVY1KTEFNRTMuOTkuNaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+xBE/4/woAJFAAsAABUASKAA4AACLAsUACQAACoBYwACgACqqqqqqqqqqqqqqqqqqqqqqqqqlP//////////////665MQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqv/7EETyD/CUAsWABgAAFABIoACgAAAgCRoACAAgBAAjwAAABKqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqWokxBTUUzLjk5LjWqqqqqqqqqqqqqqqqqqqqq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'
    },
    {
      id: 'FeelTheBeat:tap',
      base64: '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EaOP9f/STEFNRTMuOTkuNaqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqr/+xBkpgdwWQrHQgA5uAZgePUBgBGBJC0cqYDm4AwB5EADAESqqqqqqqqqqqqqqqqqqqqqqqqqqqqqIAACSFW/y0MrvytMQU1FMy45OS41VVVVVVVVVVVVVVVVVZA+DX89///9f///q//7EES5AzBDCshBoBG4CMFZGEACNwDgDyMAPAIgIwHkIAC8BP6P7v3e88wb9GjpA8k/nf///t////3/+v/s7vso1fbToUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVSkI//sQZMqD8E8DyEABeAgFwFj1AAcBgRQPIQAGACANgeNAAwBEO/f////////6f///v9W/4wr4v0oDP//////////f//oVTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVUCG/p/////9X//+xBk3oPwRAPIQBEIiAMAeOAAwBEA8A8fAGAiIAoB48ABgET9Xf+9P6bv/4zj9tyvqAk//////9f////9v/8r+lH0fzRMQU1FMy45OS41qqqqqqqqqqqqqqqqqqqqqqqqqqqqqqpg///7EGTsD/CxA8dAAYAIAMAZEAAAAQCcDxwAPCIgBIAjgAAABP///////////+3///9KXHf/////////+v/u//3f/16kVUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZOYH8EUDx8AQCIgBIAjQAAABALQPIQBAAjADgCOAAAAEVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVyemtTEFNRTMuOTkuNVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVX/+xBk5I/wQQPHwA8AiAAAD/AAAAEAgA8eADwCIAcAY4AAAARVVVVVVVWjf///////////////+iN//////////////qVMQU1FMy45OS41VVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/7EGTjD/A5A8aoDwiMAAAP8AAAAQB4DxoAPAIgAAA/wAAABFVVVVVVVVVVVVVVVVVVVVVVVVXIf/////////////6KlUxBTUUzLjk5LjVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV//sQZPQP8LgDRQABSAAAAA/wAAABArgNFAAB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'
    }
  ];
  return samples;
});
