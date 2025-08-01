/*** STATE SAVER ***/
var StateSaver = {
  bind: function (obj, pars) {
    this.object = obj;
    this.params = pars;
  },
  load: function () {
    var params_str=window.location.hash.replace(/^#/, "");
    var _get = params_str.split('&');
    var a, a0;
    for (var i = 0; i < _get.length; i++) {
      a = _get[i].split('=');
      a0 = a[0];
      switch (this.params[a0]) {
      case 'b': this.object[a0] = true; break;
      case 'i': this.object[a0] = parseInt(a[1]); break;
      case 's': this.object[a0] = decodeURIComponent(a[1]); break;
      case 'a': this.object[a0] = a[1].split(','); break;
      }
    }
  },
  save: function () {
    var _get=[];
    for (var p in this.params) {
      var e = this.object[p];
      if (!e) continue;
      switch (this.params[p]) {
      case 'b': _get.push(p); break;
      case 'i': if (e != 0) _get.push(p + '=' + e); break;
      case 's': _get.push(p + '=' + encodeURIComponent(e)); break;
      case 'a':
        var nn = false;
        for (var i = 0; i < e.length; i++) {
          if (e[i] != 0) { nn = true; break; }
        }
        if (nn) { _get.push(p+'='+e.join(',')); }
        break;
      }
    }
    var params_str = _get.join('&');
    window.location.replace(
      window.location.href.replace(/^([^#]+)(#.*)?$/, "$1") + '#' + params_str
    );
  }
};

/*** UTILS ***/
function g41_build_time(lvl) { return 1 - 0.01 * lvl; }
function Round5(x){return 5*Math.round(x/5);}
function timeS2I(x){
  var m = x.match(/^(\d+):(\d{1,2})(?::(\d{1,2}))?$/);
  if (!m) { throw new TypeError("Unknown time format: " + x); }
  return m[1]*3600 + m[2]*60 + parseInt(m[3]||0, 10);
}
function timeI2S(x) {
  x = Math.round(x);
  var s = x % 60;
  if (s < 10) s = "0" + s;
  x = Math.floor(x/60);
  var m = x % 60;
  if (m < 10) m = "0" + m;
  var h = Math.floor(x/60);
  return h + ":" + m + ":" + s;
}
function small_last_3_digits(x) { 
  return String(x).replace(/^(.*)(\d{3})$/, '$1<small>$2</small>');
}
function z2xy(z) {
  z--;
  var x = (z % 801) - 400;
  var y = 400 - (z - 400 - x) / 801;
  return [x, y];
}

if (!Object.defineProperty) {
  Object.defineProperty = function (obj, prop, desc) {
    obj[prop] = desc.value;
  };
}

function polyfill(obj, name, fn) {
  if (typeof obj[name] === 'undefined') {
    Object.defineProperty(obj, name, {
      value: fn,
      configurable: true,
      writable: true
    });
  }
}

// not IE
polyfill(Math, 'hypot', function hypot(dx, dy) {
  return this.sqrt(dx*dx + dy*dy);
});

polyfill(Math, 'log10', function log10(x) {
  return this.log(x) / this.LOG10E;
});

// MDN polyfill
polyfill(Array.prototype, 'find', function find(fn, thisArg) {
  if (this == null) { throw new TypeError('"this" is null or not defined'); }
  if (typeof fn !== 'function') { throw new TypeError('predicate must be a function'); }
  for (var i = 0; i < this.length; i++) {
    if (fn.call(thisArg, this[i], i, this)) {
      return this[i];
    }
  }
  return undefined;
});

polyfill(Array.prototype, 'sum', function sum() {
  return this.reduce(function (a, b) { return a + b; }, 0);
});

// IE8
polyfill(HTMLElement.prototype, 'addEventListener', function addEventListener(event, handler) {
  this.attachEvent('on' + event, handler);
});


var $clone = function(to, from) {
  for (var p in from) {
    to[p] = from[p];
  }
  return to;
};

// versions
$$('#server').on('change', function () {
  saveVersion(this.value);
});
function parseVersion(version) {
  var m = version.match(/^(\d+)\.(\d)(\d+)$/);
  if (!m) return getMyVersion();
  return {
    speed: +m[1],
    major: +m[2],
    minor: +m[3],
    version: m[2] + '.' + m[3]
  };
}
function version2string(verRecord) {
  var str = "T" + verRecord.major + "." + verRecord.minor;
  if (verRecord.speed != 1) str += " " + verRecord.speed + "x";
  return str;
}
function getVersionFromReferrer () {
  var refDomain = document.referrer.slice(7).split('/')[0];
  if (refDomain === 'finals.travian.com') return '2.44';
  var m = refDomain.match(/t([sx]\d+)\.travian\.(\w+)/);
  if (m) {
    switch (m[1]) {
    case 's8': return m[2] === 'com' ? '1.431' : '1.45';
    case 's19': return '1.43';
    case 's20': return '2.43';
    case 'x3': return '3.45';
    default: return '1.45';
    }
  }
  m = refDomain.match(/\w+\d+\.kingdoms\.com/);
  if (m) { return '1.5'; }
  return null;
}
try {
  if (typeof localStorage === 'undefined') {
    window.localStorage = {};
  }
} catch(e) {}
function saveVersion(v) {
  try { localStorage.v = v; } catch (e) {}
}
function getMyVersion() {
  var v = getVersionFromReferrer();
  if (v) saveVersion(v);
  try {
    return localStorage.v || '1.45';
  } catch (e) {
    return '1.45';
  }
}

/**
 * @return {ArmyStas}
 */
function getInitialStats() {
  return {
    unknown: false,
    total: 0,
    lost: 0,
    combat: { i: 0, c: 0, t: 0, s: 0 },
    cost: [0, 0, 0, 0],
    upkeep: 0,
    exp: 0,
    time: { i: 0, c: 0, s: 0 }
  };
}

/**
 * 
 * @param {number} version
 * @param {'off'|'def'} side
 * @param {Army} army
 * @param {ArmyStas?} stats
 * @return {ArmyStas}
 */
function armyStats(version, side, stats, army) {
  if (stats === undefined) {
    stats = getInitialStats();
  }
  var unitsStas = units[version][army.tribe];
  if (army.troops[0] !== null) {
    unitsStas.forEach(function (unit, i) {
      var num = army.troops[i];
      stats.total += num;
      var trapped = (army.trapped || [])[i] || 0;
      var lost = army.losses ? (army.losses[i] + trapped - Math.round(trapped * 0.75)) : 0;
      stats.lost += lost;
      if (side === 'off') {
        stats.combat[unit.type] += num * unit.off;
        if (unit.off === 0 && i < 6) {
          stats.combat.s += num * 35;
        }
      } else {
        stats.combat.i += num * unit.def_i;
        stats.combat.c += num * unit.def_c;
        if (unit.off === 0 && i < 6) {
          stats.combat.s += num * 20;
        }
      }
      unit.cost.forEach(function (r, j) { stats.cost[j] += lost * r; });
      stats.upkeep += num * unit.cu;
      stats.exp += lost * unit.cu;
      var type = {20:'i',21:'c',22:'s'}[unit.prod];
      if (type) {
        var time = unit.time * Math.pow(0.9, 19);
        // great barracks/stables
        if (type !== 's') {
          time /= 2;
        }
        // horse drinking pool
        if (version >= 't3.5' && army.tribe === 0 && type === 'c') {
          time *= 0.8;
        }
        // helmets
        if (version >= 't4' && type !== 's') {
          time /= 1.2;
        }
        // recruiting
        if (version >= 't4') {
          time /= 1.1;
        }
        stats.time[type] += lost * time;
      }
    });
  } else {
    stats.unknown = true;
  }
  return stats;
}

function warsimLink(report, ver) {
  function side(item, type) {
    var atk_type = {atck:'R0',raid:'R1',sieg:'R2'}[type] || '';
    var troops = item.troops.slice(0, 10)
      .map(function (e) { return e ? String(e) : ''; })
      .join(',').replace(/,+$/, '');
    return 'r' + item.tribe + atk_type + 'u' + troops + (item.troops[10] ? 'hs100' : '');
  }
  var traps = (report.items[0].trapped || []).sum();
  var wall = (report.info.buildings || []).find(function(b) {
    return b.length === 3 && (b[0] === 26 || b[0] === 27);
  });
  return '#a:' + side(report.items[0], report.type)
    + (report.items.length === 1 ? ''
    : '#d:r' + report.items[1].tribe + 'm' + (ver === 4 ? 9 : ver)
    + (wall ? 'w' + wall[1] : '')
    + (traps ? 't' + traps : '')
    + '#' + report.items.slice(1).map(side).join('#'));
}

function offCalcLink(report, stats) {
  function balance(troops, indices) {
    if (indices.length === 1) { return 0; }
    var a = troops[indices[0]];
    var b = troops[indices[1]];
    if (a === 0 && b === 0) { return 0; }
    return Math.round(100 * a / (a + b));
  }
  var off = report.items[0];
  var time = Math.round(Math.max(stats.time.i, stats.time.c, stats.time.s) / 3600);
  var server = {classic:'1.36',legends:'1.432',kingdoms:'1.50'}[report.version];
  var map = tribeMap = [
    {i:[0,2],c:[4,5]},
    {i:[0,2],c:[4,5]},
    {i:[1],c:[3,5]},
    ,
    ,
    {i:[0,2],c:[5]},
    {i:[0,1],c:[3,5]}
  ][off.tribe];
  var percent = off.losses ? [
    balance(off.losses, map.i),
    balance(off.losses, map.c),
    balance(off.losses, [6, 7])
  ] : [0, 0, 0];
  return 'p=' + percent
    + '&t=' + time
    + '&r=' + (off.tribe + 1)
    + '&s=' + server
    + (off.tribe ? '' : '&h=20')
    + '&art=100';
} 

/*** TABLES ***/
function EventEmitter() {
  this._events = {};
}
EventEmitter.prototype.addEvent = function(type, handler) {
  if (!this._events[type]) {
    this._events[type] = [];
  }
  this._events[type].push(handler);
  return this;
};
EventEmitter.prototype.addEvents = function(obj) {
  for (var type in obj) {
    this.addEvent(type, obj[type]);
  }
};
EventEmitter.prototype.fireEvent = function(type, data) {
  (this._events[type] || []).forEach(function (handler) {
    handler.call(this, data);
  }, this);
};

/**
 * @class table model
 */
function DataTable() {
  EventEmitter.call(this);
  this.data = [];
  this.view = null;
}
DataTable.prototype = Object.create(EventEmitter.prototype);
DataTable.prototype.constructor = DataTable;

/**
 * updates one cell
 * @param {number} row index
 * @param {string} col column name
 * @param {unknown} value new value
 */
DataTable.prototype.setValue = function(row, col, value) {
  if (!this.data[row]) {
    this.data[row] = {};
  }
  var not_eqauls = false;
  if (typeof value == "object") {
    not_eqauls = (value.toString() != this.data[row][col].toString());
  } else {
    not_eqauls = (this.data[row][col] != value);
  }
  if (not_eqauls) {
    this.fireEvent('change', {
      idx: row,
      name: col,
      value: value
    });
    this.data[row][col] = value;
  }
};
/**
 * updates one row
 * @param {T} obj with values
 * @param {number} idx index of a row
 */
DataTable.prototype.updateRecord = function(obj, idx) {
  for (var field in obj) {
    this.setValue(idx, field, obj[field]);
  }
};

/**
 * updates one column
 * @param {T[]} values array of values
 * @param {string} field name of column
 */
DataTable.prototype.updateCol = function(values, field) {
  for (var i = 0, l = values.length; i < l; i++) {
    this.setValue(i, field, values[i]);
  }
};

/**
 * updates several rows
 * @param {Partial<T>[]} a array of new values - assoc.arrays
 */
DataTable.prototype.updateRecords = function(a) {
  for (var i = 0, l = a.length; i < l; i++) {
    this.updateRecord(a[i], i);
  }
};

function DataTableRangeSum(summators) {
  DataTable.call(this);
  /**
   * @var {[key: keyof in T]: (S[]) => string} assoc.array of summator objects
   */
  this.summators = summators;
}
DataTableRangeSum.prototype = Object.create(DataTable.prototype);
DataTableRangeSum.prototype.constructor = DataTableRangeSum;

/**
 * gets value from one cell
 * @param {number} row index
 * @param {string} col name
 * @param {*} value new value
 */
DataTableRangeSum.prototype.getValue = function(row, col) {
  if (!this.data[row]) {
    return undefined;
  }
  return this.data[row][col];
};

/**
 * updates sum row on updating 
 */
DataTableRangeSum.prototype.updateSum = function() {
  var obj = {};
  for (var col in this.summators) {
    var sm = this.summators[col];
    obj[col] = sm.func(this, col);
  }
  this.updateRecord(obj, "sumRow");
};

/**
 * updates range of summing
 * @param {number} low lower row index
 * @param {number} high upper row index (inclusive)
 */
DataTableRangeSum.prototype.updateRange = function(low, high) {
  this.rangeLow = low;
  this.rangeHigh = high;
  this.updateSum();
};

/**
 * updates several rows - overriding parent one
 * @param {Partial<T>[]} a new values
 */
DataTableRangeSum.prototype.updateRecords = function(a) {
  DataTable.prototype.updateRecords.call(this, a);
  this.updateSum();
};

/**
 * returns range of summing
 * @return {{ low: number, high: number }}
 */
DataTableRangeSum.prototype.getRange = function() {
  return {
    low: this.rangeLow,
    high: this.rangeHigh
  };
};


/* summators */
var SummatorHelper = {
  trivial: {
    defaultValue: 0,
    func: function(model, field) {
      var ranges = model.getRange();
      var val = this.defaultValue;
      for (var r = ranges.low; r <= ranges.high; r++) {
        val += model.getValue(r, field);
      }
      return val;
    }
  },
  delta: {
    defaultValue: 0,
    func: function(model, field) {
      var ranges = model.getRange();
      if (typeof ranges.low == "undefined") return "&mdash;";
      var subLowerValue = model.getValue(ranges.low-1, field);
      if (typeof(subLowerValue) == "undefined") {
        subLowerValue = this.defaultValue;
      }
      return model.getValue(ranges.high, field) - subLowerValue;
    }    
  }
};


/**
 * @class controller for dom table with "smart" update functionality
 */
/**
 * initialize object
 * @param {HTMLElement} table
 * @param {Object} options other options
 * @constructor
 */
function DOMTable(table, options) {
  EventEmitter.call(this);
  this.offsetTop = 0;
  this.offsetLeft = 0;

  /** @type {HTMLTableElement} */
  this._table = table;
  /** @type {string[]} */
  this.fields = options.fields;
  this.convert = options.convert;
  this.rowcount = 0;
  if (options) {
    if (options.offsetLeft) this.offsetLeft = options.offsetLeft;
    if (options.offsetTop) this.offsetTop = options.offsetTop;
  }
  table.addEventListener('mousemove', this.eventWrapperFactory('cellenter'));
  // table.addEventListener('mouseleave', this.eventWrapperFactory('cellleave'));
  // table.addEventListener('mouseleave', this.eventWrapperFactory('tableleave'));
  table.addEventListener('click', this.eventWrapperFactory('cellclick'));
}

DOMTable.prototype = Object.create(EventEmitter.prototype);
DOMTable.prototype.constructor = DOMTable;
  
/**
 * creates wrapper for DOM events, used to process own "software" events
 * @param {string} _type type of custom events
 * @see this.events
 */
DOMTable.prototype.eventWrapperFactory = function(_type) {
  var _self = this;
  return (function (evt) {
    var elt = evt.target;
    var tagName = elt.tagName.toLowerCase();
    if (tagName == "td") {
      _self.fireEvent(_type, {
        x: elt.cellIndex - _self.offsetLeft,
        y: elt.parentNode.rowIndex - _self.offsetTop,
        cell: elt
      });
    }
  });
};

/**
 * gets row of a table 
 * @param {number} row_idx
 * @private
 */
DOMTable.prototype.getRow = function(row_idx) {
  row_idx += this.offsetTop;
  if (row_idx < 0) {
    throw RangeError("row [" + row_idx + "] is out of range");
  }
  if (row_idx >= this._table.rows.length) {
    throw RangeError("row [" + row_idx + "] is out of range (" + this._table.rows.length + ")");
  }
  return this._table.rows[row_idx];
};

/**
 * actually updates cell in a table
 * @param {number} row_idx
 * @param {number} cell_idx
 * @param {unknown} value would be pasted into cell
 */
DOMTable.prototype.updateCell = function(row_idx, name, value) {
  if (typeof value == "undefined") return;
  var cell_idx = this.fields.indexOf(name);
  if (cell_idx == -1) return;
  var cell = this.getRow(row_idx).cells[cell_idx + this.offsetLeft];
  if (this.convert[name]) {
    this.convert[name](cell, value);
  } else {
    cell.textContent = value;
  }
};

/**
 * hides rows range (inclusive), determined by 2 numbers
 * @param {number} from lower index of rows
 * @param {number} to upper index of rows
 */
DOMTable.prototype.hideRows = function(from, to) {
  for (var i = from; i <= to; i++) {
    this.getRow(i).style.display = "none";
  }
};
/**
 * shows rows range (inclusive), determined by 2 numbers
 * @param {number} from lower index of rows
 * @param {number} to upper index of rows
 */
DOMTable.prototype.showRows = function(from, to) {
  for (var i = from; i <= to; i++) {
    this.getRow(i).style.display = "";
  }
};

/**
 * shows or hide columns determined by assoc.array
 * @param {[key: keyof T]: boolean} arr
 */
DOMTable.prototype.showCols = function(arr) {
  for (var r = 0, l = this._table.rows.length; r < l; r++) {
    var row = this._table.rows[r];
    for (var name in arr) {
      var cell_idx = this.fields.indexOf(name);
      if (cell_idx != -1) {
        var cell = row.cells[cell_idx + this.offsetLeft];
        if (!cell) continue;
        cell.style.display = arr[name] ? "" : "none";
      }
    }
  }
};

/**
 * updates amount of rows
 * @param {number} n new rows count
 */
DOMTable.prototype.updateRowCount = function(n) {
  var delta = this.rowcount - n;
  var colCount = this._table.rows[1].cells.length;
  while (delta < 0) {
    var row = this._table.insertRow(n + delta+ this.offsetTop);
    for (var c = 0; c < colCount; c++) {
      row.insertCell(c);
    }
    delta++;
  }
  while (delta > 0) {
    this._table.deleteRow(n + delta + this.offsetTop - 1);
    delta--;
  }
  this.rowcount = n;
};


/**
 * @class DOMTable controller with range summator
 */
function DOMTableRangeSelect(table, options) {
  DOMTable.call(this, table, options);
  this.hoveredRows = [];
  for (var r = 0; r <= this.rowcount; r++) {
    this.hoveredRows[r] = "";
  }
  this.fromRow = this.UNSELECTED;
  this.toRow = this.UNSELECTED;
  this.state = this.STATES.SELECT_FROM;
  this.addEvent('cellenter', this._enter);
  this.addEvent('cellclick', this._click);
}
DOMTableRangeSelect.prototype = Object.create(DOMTable.prototype);
DOMTableRangeSelect.prototype.constructor = DOMTableRangeSelect;
DOMTableRangeSelect.prototype.classHover = "hover";
DOMTableRangeSelect.prototype.classActive = "active";
/**
 * @const class constant to indicate index of unselected bound
 */
DOMTableRangeSelect.prototype.UNSELECTED = -1;

/**
 * @const class constants set to indicate state of current selection
 */
DOMTableRangeSelect.prototype.STATES = {
  SELECT_FROM: 0,
  SELECT_TO: 1,
  SELECT_NONE: 2
};

/**
 * gets row of a table 
 * @param {number} row_idx
 * @return {HTMLTableRowElement}
 * @private
 */
DOMTableRangeSelect.prototype.getRow = function(row_idx) {
  if (row_idx == "sumRow") {
    var rr = this._table.rows;
    return rr[rr.length-1];
  }
  return DOMTable.prototype.getRow.call(this, row_idx);
};

/**
 * gets row of a table 
 * @param {number} row_idx
 * @param {string} className new class name
 * @private
 */
DOMTableRangeSelect.prototype.updateRowClass = function(row_idx, className) {
  var row = this.getRow(row_idx);
  var cl = this.hoveredRows[row_idx];
  if (className) {
    if (cl != className) {
      if (cl) row.classList.remove(cl);
      row.classList.add(className);
    }
  } else {
    if (cl) row.classList.remove(cl);
  }
  this.hoveredRows[row_idx] = className;
};

/**
 * event handler for cellenter
 * @private
 */
DOMTableRangeSelect.prototype._enter = function(evt) {
  var r;
  if (evt.y < 0) return;
  if (evt.y >= this.rowcount) return;
  switch(this.state) {
    case this.STATES.SELECT_FROM:
      for (r = 0, l = this.rowcount; r <= l; r++) {
        if (r == evt.y) {
          this.updateRowClass(r, this.classHover);
        } else {
          this.updateRowClass(r, "");
        }
      }
      break;
    case this.STATES.SELECT_TO:
      var low, high;
      if (this.fromRow < evt.y) {
        low = this.fromRow;
        high = evt.y;
      } else {
        low = evt.y;
        high = this.fromRow;
      }
      for (r = 0; r < low; r++) {
        this.updateRowClass(r, "");
      }
      this.updateRowClass(low, this.classActive);
      for (r = low+1; r < high; r++) {
        this.updateRowClass(r, this.classHover);
      }
      this.updateRowClass(high, this.classActive);
      for (r = high+1; r <= this.rowcount; r++) {
        this.updateRowClass(r, "");
      }
      break;
    case this.STATES.SELECT_NONE: break;
  }
};

/**
 * event handler for click
 * @private
 */
DOMTableRangeSelect.prototype._click = function(evt) {
  if (evt.y < 0) return;
  if (evt.y >= this.rowcount) return;
  switch(this.state) {
    case this.STATES.SELECT_FROM:
      this._table.style.cursor = "n-resize";
      this.state = this.STATES.SELECT_TO;
      this.fromRow = evt.y;
      break;
    case this.STATES.SELECT_TO:
      this._table.style.cursor = "";
      this.state = this.STATES.SELECT_NONE;
      if (evt.y < this.fromRow) {
        this.toRow = this.fromRow;
        this.fromRow = evt.y;
      } else {
        this.toRow = evt.y;
      }
      this.fireEvent("rangeChange", {
        low: this.fromRow,
        high: this.toRow
      });
      break;
    case this.STATES.SELECT_NONE:
      this._table.style.cursor = "cell";
      this.state = this.STATES.SELECT_FROM;
      this.toRow = this.UNSELECTED;
      this.fromRow = this.UNSELECTED;
      for (var r = 0, l = this.rowcount; r <= l; r++) {
        this.updateRowClass(r, "");
      }
      this.fireEvent("rangeChange", {
        low: undefined,
        high: undefined
      });
      break;
  }
};

/**
 * sets selection range
 * @param {number} low index of a row
 * @param {number} high index of a row
 */
DOMTableRangeSelect.prototype.setRange = function(low, high) {
  var r;
  this.state = this.STATES.SELECT_NONE;
  this.fromRow = low;
  this.toRow = high;
  for (r = 0; r < low; r++) {
    this.updateRowClass(r, "");
  }
  this.updateRowClass(low, this.classActive);
  for (r = low+1; r < high; r++) {
    this.updateRowClass(r, this.classHover);
  }
  this.updateRowClass(high, this.classActive);
  for (r = high+1; r <= this.rowcount; r++) {
    this.updateRowClass(r, "");
  }
  this.fireEvent("rangeChange", {
    low: this.fromRow,
    high: this.toRow
  });
};


/* view helper */
var TableHelper = {
  cellNiceFixedFactory: function(digits) {
    return (function(cell, value) {
      if (value) {
        cell.innerHTML = value.toFixed ? value.toFixed(digits).replace(/(\.)?0+$/, "") : value;
      } else {
        cell.innerHTML = "&mdash;";
      }
    });
  },
  convertFactory: function(convertFunction) {
    return (function(cell, value) {
      cell.innerHTML = convertFunction(value);
    });
  },
  trivial: function(cell, value) {
    cell.innerHTML = value;
  }
};
