var _ = require('lodash');

function FieldMap(fieldOrd, srcMap){

	if(srcMap)
	{
		copyStateFromSource(this, srcMap);
	}
	else
	{
		this._fields = []; //{key: 1, value: Field}
		this._groups = []; //{key: 1, list: [Group, Group, Group]}
		this._fieldOrder = fieldOrd ? fieldOrd : null;
		this.repeatedTags = []; //[Field, Field, Field]
	}
}

FieldMap.prototype = {

	removeField: function(field){

		_.remove(this._fields, field);
	},

	isEmpty: function (){

		return !_.any(this._fields) && !_.any(this._groups);
	},

	clear: function (){

		this._fields = [];

		this._groups = [];
	},

	groupCount: function(fieldNo) {

		var group = _.findKey(this._groups, fieldNo);

		return group ? group.list.length : 0;
	}
};

function copyStateFromSource(fieldMap, src){

	fieldMap._fieldOrder = src._fieldOrder;

	fieldMap._fields = src._fields;

	fieldMap._groups = [];

	_.forEach(src._groups, function(g){

		fieldMap._groups.push(g);
	});

	fieldMap.repeatedTags = src.RepeatedTags;
}

module.exports = FieldMap;