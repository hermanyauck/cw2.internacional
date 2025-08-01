var effects_t5 = [].slice.call(left.options, -3).map(function (option) {
  return option.getAttribute('effect');
});
var effects_t4 = ['{"sm":[30]}', '{"sm":[40]}', '{"sm":[50]}'];
var Model = {
  lastChange: 'start',
  state: {
    cc: [0, 0, 3, 4],
    ts: 0,
    srv: getMyVersion(),
    spd: 7,
    art: 1,
    boots: 0,
    left: 0,
    sm: 0,
    size: 400
  },
  extra: {
    boots: {},
    left: {},
    srv: { speed: 1, major: 4, minor: 0, }
  },
  update: function(name, value, extra) {
    var m = name.match(/^(.*)\.(.*)$/);
    if (m) {
      this.state[m[1]][m[2]] = value;
    } else {
      this.state[name] = value;
    }
    if (typeof extra == "object") {
      this.extra[name] = extra;
    }
    StateSaver.save();
    this.rebuildTime();
  },
  load: function() {
    var ccDOM = $$(".coords");
    var s = this.state;
    $('size').value = s.size;
    s.cc.forEach(function (value, i) {
      ccDOM[i].value = value || '';
      ccDOM[i].min = -s.size;
      ccDOM[i].max = +s.size;
    });
    $server.value = Model.state.srv;
    $('unit_spd').value = s.spd;
    $server.value = s.srv;
    $('arena_lvl').value = s.ts;
    $('arena_lvl_val').innerHTML = s.ts;
    $('art_spd').value = s.art;
    $boots.value = s.boots;
    $left.value = s.left;
    serverChange.call($server);
  },
  arenaBonus: function (cap, distance, level) {
    if (distance <= cap) return 1;
    return ((distance - cap) / (1 + 0.1 * level) + cap) / distance;
  },
  rebuildTime: function () {
    const srv = this.extra.srv;
    var time;
    var timeStr = this.lastChange === 'end'
      ? $('end_time').value
      : $('start_time').value;
    try {
      time = timeStr ? timeS2I(timeStr) : 0;
    } catch(e) {
      return;
    }
    var size = this.state.size;
    if (!this.state.cc.every(function (n) {
      return Math.abs(n) <= size;
    })) {
      $('travel_time').innerHTML = '???';
      return;
    }
    var unit_spd = parseInt(this.state.spd);
    var arena_lvl = parseInt(this.state.ts);
    var boots_lvl = (this.extra.boots.ts || 0) / 10;
    var arenaBonus = this.arenaBonus.bind(this, SERVER.arenaDistance());
    if (SERVER.isDoubleArena()) {
      arena_lvl *= 2;
    }
    if (SERVER.hasItems()) {
      unit_spd += +this.extra.boots.spd || 0;
      unit_spd *= 1 + (+this.extra.left.sm || 0) / 100;
    }
    var art_spd = this.state.art;
    if (art_spd < 0) art_spd = -1 / art_spd;
    var d = Math.hypot(
      delta(this.state.cc[0], this.state.cc[2], this.state.size),
      delta(this.state.cc[1], this.state.cc[3], this.state.size)
    );
    $('distance').innerHTML = d.toFixed(3).replace(/\.?0+$/, '');
    if (srv.major >= 5) {
      d = d * arenaBonus(d, arena_lvl)
            * arenaBonus(d, boots_lvl);
    } else {
      d = d * arenaBonus(d, arena_lvl + boots_lvl);
    }
    unit_spd *= art_spd;
    var roundFn = srv.major === 5 ? Math.floor : Math.round;
    time_travel = roundFn(3600 * d / unit_spd);
    $('travel_time').innerHTML = timeI2S(time_travel);

    if (this.lastChange === 'end') {
      time -= time_travel - 86400;
      time %= 86400;
      $('start_time').value = timeI2S(time);
    } else {
      time += time_travel;
      time %= 86400;
      $('end_time').value = timeI2S(time);
    }
  }
};
StateSaver.bind(Model.state, {
  cc: 'a', ts: 'i', srv: 's', size: 'i', spd: 'i', art: 's',
  boots: 'i', left: 'i', extra: 'i'});

function unique(array) {
  const obj = Object.create(null);
  array.forEach(function (e) {
    obj[e] = true;
  });
  var result = [];
  for (var k in obj) {
    result.push(k);
  }
  return result;
}  

$('start_time').addEventListener('change', function () {
  Model.lastChange = 'start';
  Model.rebuildTime();
});
$('end_time').addEventListener('change', function () {
  Model.lastChange = 'end';
  Model.rebuildTime();
});

/* controllers */
$$(".coords").on('input', function onCoordsChange() {
  var val = this.value;
  if (val === '-') val = 0;
  Model.update('cc.' + this.getAttribute('idx'), +val);
});
$$(".coords").on('focus', function onCoordsFocus() {
  this.select();
});

$('speed_table').addEventListener('click', function(event) {
  var tgt, tagName = event.target.tagName.toLowerCase();
  if (tagName == "img") {
    tgt = event.target.parentNode;
  } else if (event.target.className === "level") {
    tgt = event.target.parentNode;
  } else if (tagName === "td") {
    tgt = event.target;
  } else {
    return true;
  }
  $$("#speed_table .active").removeClass('active');
  tgt.classList.add('active');
  var speed = tgt.getAttribute('spd') * SERVER.troopsSpeed();
  $('unit_spd').value = speed;
  Model.update('spd', speed);
});

$('unit_spd').addEventListener('change', function () {
  $$("#speed_table .active").removeClass('active');
  $$("#speed_table .spd-" + Math.floor(this.value / SERVER.troopsSpeed())).addClass('active');
  Model.update('spd', this.value);
});

function serverChange() {
  var srv = this.value;
  var verRec = parseVersion(srv);
  var oldSpd = SERVER.troopsSpeed();
  SERVER.setParsedVersion(verRec);
  var newSpd = SERVER.troopsSpeed();
  var oldVal = $('unit_spd').value;
  var newVal = oldVal * newSpd / oldSpd;
  if (newVal !== ~~newVal) {
    newVal = (oldVal - 3) * newSpd / oldSpd + 3;
  }
  $('unit_spd').value = newVal;
  $('unit_spd').min = 3 * newSpd;
  $('unit_spd').max = (verRec.major >= 5 ? 30 : 25) * newSpd;
  var set = Object.create(null);
  for (var t = 0; t < 3; t++) {
    units[t].forEach(function (u) {
      set[u.speed * newSpd] = true;
    });
  };
  [14, 17, 20].forEach(function (s) {
    set[s * newSpd] = true; // horses
    set[(s + 5) * newSpd] = true; // gauls
  });
  if (SERVER.hasExtraRaces()) {
    // huns
    set[14 * newSpd + 3] = true;
    set[16 * newSpd + 3] = true;
    for (var t = 5; t < 7; t++) {
      units[t].forEach(function (u) {
        set[u.speed * newSpd] = true;
      });
    };  
  }
  if (verRec.major >= 5) {
    for (var s = 14; s <= 30; s++) set[s * newSpd] = true;
  }
  delete set[0];
$('unit_spd').innerHTML = Object.keys(set).map(function (s) {
    return '<option value="' + s + '">' + s + '</option>';
  }).join('');
  var major = verRec.major;
  var effects = major == 5 ? effects_t5 : effects_t4;
  var worldSize = SERVER.worldOnlySize();
  var hasNewTribes = SERVER.hasExtraRaces();
  if (worldSize != null && Model.state.size !== worldSize) {
    $('size').value = worldSize;
    sizeChange.call($('size'));
  }
  $$("#speed_table tr.mode4").css('display', hasNewTribes ? '' : 'none');
  for (var i = left.options.length - 3; i < left.options.length; i++) {
    left.options[i].setAttribute('effect', effects[i - left.options.length + 3]);
  }
  $('input_wrapper').className = 'pmode' + major;
  Model.update('srv', srv, verRec);
  bootsChange.call($boots);
  leftChange.call($left);
}

var $server = $('server');
$server.addEventListener('change', serverChange);
function sizeChange() {
  var size = +this.value;
  $$(".coords").forEach(function (elt) {
    elt.min = -size;
    elt.max = +size;
  });
  Model.update('size', size);
}
$('size').addEventListener('change', sizeChange);
$('arena_lvl').addEventListener('input', function() {
  $('arena_lvl_val').innerHTML = this.value;
});
$('arena_lvl').addEventListener('change', function() {
  Model.update('ts', +this.value);
});

$('art_spd').addEventListener('change', function() {
  Model.update('art', this.value);
});
function getVar4Value(array) {
  switch (array.length) {
  case 1: return array[0];
  case 2: return array[0];
  case 3: return array[1];
  case 5:
    if (array[0] + array[4] !== array[2] * 2) {
      return array[0];
    } else {
      return array[2];
    }
  }
}

var $boots = $('boots');
var $bv = $('boots_var');
var $bc = $('boots_crystals');
function bootsChange() {
  if (this.selectedIndex == -1) { return; }
  var effect = JSON.parse(getSelectedOption(this).getAttribute('effect')),
      k, value,
      itemVariations = false;
  $bv.style.display = 'none';
  for (k in effect) {
    value = effect[k];
    if (typeof value !== 'object') continue;
    if (Model.extra.srv.major >= 5) {
      itemVariations = true;
      $('boots_var').innerHTML = value.map(function (val, i) {
        return '<option value="' + i + '">' + val + '</option>';
      });
      $('boots_var').selectedIndex = Math.floor((value.length-1) / 2);
    } else {
      effect[k] = this.value === '100' ? 3 : getVar4Value(value);
    }
  }
  $('boots_note').style.display = ('spd' in effect) ? '' : 'none';
  if (itemVariations) {
    $bv.style.display = '';
    bootsVarChange.call($bv);
  } else {
    Model.update('boots', this.value, effect);
  }
}
function getSelectedOption(select) {
  return select.options[select.selectedIndex];
}
function bootsVarChange() {
  var option = getSelectedOption($boots),
      effect = JSON.parse(option.getAttribute('effect'));
  for (var k in effect) {
    var v = effect[k];
    if (typeof v === 'object') {
      effect[k] = v[$bv.value] + option.dataset.crystal * $bc.value;
    }
  }
  Model.update('boots', $boots.value, effect);
}

var $lv = $('left_var');
var $left = $('left');
var $lc = $('left_crystals');
function leftChange() {
  if (this.selectedIndex == -1) { return; }
  var effect = JSON.parse(getSelectedOption(this).getAttribute('effect')),
      k, value,
      itemVariations = false;
  $lv.style.display = 'none';
  for (k in effect) {
    value = effect[k];
    if (typeof value !== 'object') continue;
    if (Model.extra.srv.major >= 5) {
      itemVariations = true;
      $lv.innerHTML = value.map(function (val, i) {
        return '<option value="' + i + '">' + val + '</option>';
      }).join('');
      var index = Math.floor((value.length-1) / 2);
      $lv.selectedIndex = index;
    } else {
      effect[k] = getVar4Value(value);
    }
  }
  $('left_note').style.display = ((61 <= this.value) && (this.value <= 63)) ? '' : 'none';
  if (itemVariations) {
    $lv.style.display = '';
    leftVarChange.call($lv);
  } else {
    Model.update('left', this.value, effect);
  }
}
function leftVarChange() {
  var option = $left.selectedOptions[0],
      effect = JSON.parse(option.getAttribute('effect'));
  for (var k in effect) {
    var v = effect[k];
    if (typeof v === 'object') {
      effect[k] = v[$lv.value] + option.dataset.crystal * $lc.value;
    }
  }
  Model.update('left', $left.value, effect);
}
$boots.addEventListener('change', bootsChange);
$bv.addEventListener('change', bootsVarChange);
$bc.addEventListener('change', bootsVarChange);
$left.addEventListener('change', leftChange);
$lv.addEventListener('change', leftVarChange);
$lc.addEventListener('change', leftVarChange);

function delta(c1, c2, size) {
  return (c1 - c2 + (3 * size + 1)) % (2 * size + 1) - size;
}

StateSaver.load();
Model.load();
