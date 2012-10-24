/********************************************************************************************************************************************************/
/*****************************************************	SEARCH NAVIGATION WIDGET: START		*************************************************************/

var intTotalResponse = 0;
var _previous_QS = "";

function set_rand_identifier(){
 _rand_identifier = Math.floor(Math.random()*10000);
}

var _rand_identifier;
set_rand_identifier();

;(function($) {
	
$.fn.extend({
	autocomplete: function(urlOrData, options) {
		var isUrl = typeof urlOrData == "string";
		options = $.extend({}, $.Autocompleter.defaults, {
			url: isUrl ? urlOrData : null,
			data: isUrl ? null : urlOrData,
			delay: isUrl ? $.Autocompleter.defaults.delay : 10,
			max: options && !options.scroll ? 10 : 150
		}, options);
		
		// if highlight is set to false, replace it with a do-nothing function
		options.highlight = options.highlight || function(value) { return value; };
		
		// if the formatMatch option is not specified, then use formatItem for backwards compatibility
		options.formatMatch = options.formatMatch || options.formatItem;
		
		return this.each(function() {
			new $.Autocompleter(this, options);
		});
	},
	result: function(handler) {
		return this.bind("result", handler);
	},
	search: function(handler) {
		return this.trigger("search", [handler]);
	},
	flushCache: function() {
		return this.trigger("flushCache");
	},
	setOptions: function(options){
		return this.trigger("setOptions", [options]);
	},
	unautocomplete: function() {
		return this.trigger("unautocomplete");
	}
});

$.Autocompleter = function(input, options) {

	var KEY = {
		UP: 38,
		DOWN: 40,
		DEL: 46,
		TAB: 9,
		RETURN: 13,
		ESC: 27,
		COMMA: 188,
		PAGEUP: 33,
		PAGEDOWN: 34,
		BACKSPACE: 8
	};

	// Create $ object for input element
	var $input = $(input).attr("autocomplete", "off").addClass(options.inputClass);

	var timeout;
	var previousValue = "";
	var cache = $.Autocompleter.Cache(options);
	var hasFocus = 0;
	var lastKeyPressCode;
	var config = {
		mouseDownOnSelect: false
	};
	var select = $.Autocompleter.Select(options, input, selectCurrent, config);
	
	$input.keydown(function(event) {
		// track last key pressed
		lastKeyPressCode = event.keyCode;
		switch(event.keyCode) {
		
			case KEY.UP:
				event.preventDefault();
				if ( select.visible() ) {
					select.prev();
				} else {
					onChange(0, true);
				}
				break;
				
			case KEY.DOWN:
				event.preventDefault();
				break;
				
			case KEY.PAGEUP:
				event.preventDefault();
				if ( select.visible() ) {
					select.pageUp();
				} else {
					onChange(0, true);
				}
				break;
				
			case KEY.PAGEDOWN:
				event.preventDefault();
				if ( select.visible() ) {
					select.pageDown();
				} else {
					onChange(0, true);
				}
				break;
			
			// matches also semicolon
			case options.multiple && $.trim(options.multipleSeparator) == "," && KEY.COMMA:
			
            case KEY.TAB:
                     event.preventDefault();
                     select.hide();
                     break;
                
			case KEY.RETURN:
			event.preventDefault();
                     select.hide();
                     break;
				
			case KEY.ESC:
                event.preventDefault();
				select.hide();
				break;
				
			default:
				clearTimeout(timeout);
				timeout = setTimeout(onChange, options.delay);
				break;
		}
	}).keypress(function() {
		// having fun with opera - remove this binding and Opera submits the form when we select an entry via return
	}).focus(function(){
		// track whether the field has focus, we shouldn't process any
		// results if the field no longer has focus
		hasFocus++;
	}).blur(function() {
		hasFocus = 0;
		if (!config.mouseDownOnSelect) {
			hideResults();
		}
	}).dblclick(function(){
		if (select.visible() ) {
		    select.next(); 
		} else { 
			onChange(0, true); 
		}
	}).click(function() {
		// show select when clicking in a focused field
       		if ( hasFocus++ > 1 && !select.visible() ) {
			onChange(0, false);
		}
	}).bind("search", function() {
		// TODO why not just specifying both arguments?
		var fn = (arguments.length > 1) ? arguments[1] : null;
		function findValueCallback(q, data) {
			var result;
			if( data && data.length ) {
				for (var i=0; i < data.length; i++) {
					if( data[i].result.toLowerCase() == q.toLowerCase() ) {
						result = data[i];
						break;
					}
				}
			}
			if( typeof fn == "function" ) fn(result);
			else $input.trigger("result", result && [result.data, result.value]);
		}
		$.each(trimWords($input.val()), function(i, value) {
			request(value, findValueCallback, findValueCallback);
		});
	}).bind("flushCache", function() {
		cache.flush();
	}).bind("setOptions", function() {
		$.extend(options, arguments[1]);
		// if we've updated the data, repopulate
		if ( "data" in arguments[1] )
			cache.populate();
	}).bind("unautocomplete", function() {
		select.unbind();
		$input.unbind();
	});
	
	
	function selectCurrent() {
		var selected = select.selected();
		if( !selected )
			return false;
		
		var v = selected.result;
		previousValue = v;
		
		if ( options.multiple ) {
			var words = trimWords($input.val());
			if ( words.length > 1 ) {
				v = words.slice(0, words.length - 1).join( options.multipleSeparator ) + options.multipleSeparator + v;
			}
			v += options.multipleSeparator;
		}
		
		$input.val(v);
		hideResultsNow();
		$input.trigger("result", [selected.data, selected.value]);
		return true;
	}
	
	function onChange(crap, skipPrevCheck) {
		if( lastKeyPressCode == KEY.DEL ) {
       		select.hide();
			return;
		}
		
		var currentValue = $input.val();
		
		if ( !skipPrevCheck && currentValue == previousValue )
			return;
		
		previousValue = currentValue;
		
		currentValue = lastWord(currentValue);
		if ( currentValue.length >= options.minChars) {
			$input.addClass(options.loadingClass);
			if (!options.matchCase)
				currentValue = currentValue.toLowerCase();
               	request(currentValue, receiveData, hideResultsNow);
		} else {
			stopLoading();
			select.hide();
		}
	};
	
	function trimWords(value) {
		if ( !value ) {
			return [""];
		}
		var words = value.split( options.multipleSeparator );
		var result = [];
		$.each(words, function(i, value) {
			if ( $.trim(value) )
				result[i] = $.trim(value);
		});
		return result;
	}
	
	function lastWord(value) {
		if ( !options.multiple )
			return value;
		var words = trimWords(value);
		return words[words.length - 1];
	}
	
	// fills in the input box w/the first match (assumed to be the best match)
	// q: the term entered
	// sValue: the first matching result
	function autoFill(q, sValue){
    
		// autofill in the complete box w/the first match as long as the user hasn't entered in more data
		// if the last user key pressed was backspace, don't autofill
		if( options.autoFill && (lastWord($input.val()).toLowerCase() == q.toLowerCase()) && lastKeyPressCode != KEY.BACKSPACE ) {
			// fill in the value (keep the case the user has typed)
			$input.val($input.val() + sValue.substring(lastWord(previousValue).length));
			// select the portion of the value not typed by the user (so the next character will erase)
			$.Autocompleter.Selection(input, previousValue.length, previousValue.length + sValue.length);
		}
	};

	function hideResults() {
		clearTimeout(timeout);
		timeout = setTimeout(hideResultsNow, 200);
	};

	function hideResultsNow() {
		select.hide();
		clearTimeout(timeout);
		stopLoading();
	};

	function receiveData(q, data) { 
	        if ( data && data.length && hasFocus && q!="") {
          	stopLoading();
          	select.display(data, q);
           	autoFill(q, data[0].value);
		
			var urls_to_show=new Array();
            for(counter_data=0; counter_data<data.length; ++counter_data)
			{
					urls_to_show=$.merge(urls_to_show, data[counter_data].data.urls);
			}
			
			var urls_to_show_final=new Array();
			for(counter_urls=0; counter_urls < urls_to_show.length; ++counter_urls)	{
				if(jQuery.inArray(urls_to_show[counter_urls], urls_to_show_final) == -1)	{
					urls_to_show_final.push(urls_to_show[counter_urls]);
				}
				if(urls_to_show_final.length > 7)	{
					break;
				}
			}

            for(fragment=0; fragment < 7; ++fragment)
            {   
                $("#nav_placeholder_" + fragment).html("");
            }

			if(q=="default_nav_key")	{
				$("#defaultMessage").css("display","block");	
				$("#defaultMessage").css("background-color","#90BBE3");
			} else	{
				$("#defaultMessage").css("display","none");	
				$("#defaultMessage").css("background-color","");
			}

			intTotalResponse = 0;
            for(var fragment=0; fragment < urls_to_show_final.length && fragment < 7; fragment++)
            {                        
                if(urls_to_show_final[fragment]!=null && urls_to_show_final[fragment]!="")	
                {                  
                  //$("#nav_placeholder_" + fragment).load(urls_to_show_final[fragment]); 
                  if(urls_to_show_final[fragment].indexOf("?")==-1){
                   urls_to_show_final[fragment] = urls_to_show_final[fragment] + "?rand_num=" +  _rand_identifier;
                  } else {
                   urls_to_show_final[fragment] = urls_to_show_final[fragment] + "&rand_num=" +  _rand_identifier;
                  }
                  
					var strAjaxCall = '';
					strAjaxCall += '$.ajax({';
					strAjaxCall += '      url: urls_to_show_final['+fragment+'],';
					strAjaxCall += '      cache: true,';
					strAjaxCall += '      success: function(data)';
					strAjaxCall += '      {';
					strAjaxCall += '         $("#nav_placeholder_'+ fragment +'").html(data);';
					strAjaxCall += '         chekAllResponseDone('+ urls_to_show_final.length +');';
					strAjaxCall += '      },';
					strAjaxCall += '      error: function(data)';
					strAjaxCall += '      {';
					strAjaxCall += '          $("#nav_placeholder_'+ fragment +'").html("");';
					strAjaxCall += '         chekAllResponseDone('+ urls_to_show_final.length +');';
					strAjaxCall += '      }';
					strAjaxCall += '  })';

					eval(strAjaxCall);

                }
            }		
		} else {
               	hideResultsNow();
		}        
		_previous_QS = q;
		var _tm =  setTimeout("if( $('#navwidettext').attr('value').toLowerCase() != _previous_QS.toLowerCase() ){ if('default_nav_key' != _previous_QS){$('#navwidettext').trigger('dblclick')}}", 400);
	};
   	function request(term, success, failure) 
    {
        
		if (!options.matchCase)
			term = term.toLowerCase();
		var data = cache.load(term);
		// recieve the cached data
		if (data && data.length) 
        {
			success(term, data);
		// if an AJAX url has been supplied, try loading the data now
		} 
        else if( (typeof options.url == "string") && (options.url.length > 0) )
        {
            var extraParams = 
            {
                timestamp: +new Date()
			};
			$.each(options.extraParams, function(key, param) 
            {
				extraParams[key] = typeof param == "function" ? param() : param;
			});
			
			$.ajax({
				// try to leverage ajaxQueue plugin to abort previous requests
				mode: "abort",
				// limit abortion to this input
				port: "autocomplete" + input.name,
				dataType: options.dataType,
				url: options.url,
				data: $.extend({
					q: lastWord(term),
					limit: options.max
				}, extraParams),
				success: function(data) {
					var parsed = options.parse && options.parse(data) || parse(data);
					cache.add(term, parsed);
					success(term, parsed);
				}
			});            
        } else {
     			// if we have a failure, we need to empty the list -- this prevents the the [TAB] key from selecting the last successful match
			
            select.emptyList();
			failure(term);
            //alert('haveDefault= '+haveDefault);
			$("#defaultMessage").css("display","none");
            if(haveDefault)
            {
                 _previous_QS = "default_nav_key";
                 request("default_nav_key", success, failure); 
            } 	
			
			for(fragment=0; fragment < 7; ++fragment)
			 {			
				 $("#nav_placeholder_" + fragment).html("");
			 }

		}
	};
	
	function parse(data) {
		var parsed = [];
		var rows = data.split("\n");
		for (var i=0; i < rows.length; i++) {
			var row = $.trim(rows[i]);
			if (row) {
				row = row.split("|");
				parsed[parsed.length] = {
					data: row,
					value: row[0],
					result: options.formatResult && options.formatResult(row, row[0]) || row[0]
				};
			}
		}
		return parsed;
	};

	function stopLoading() {
		$input.removeClass(options.loadingClass);
	};

};

$.Autocompleter.defaults = {
	inputClass: "ac_input",
	resultsClass: "ac_results",
	loadingClass: "ac_loading",
	minChars: 1,
	delay: 400,
	matchCase: false,
	matchSubset: true,
	matchContains: false,
	cacheLength: 10,
	max: 100,
	mustMatch: false,
	extraParams: {},
	selectFirst: true,
	formatItem: function(row) { return row[0]; },
	formatMatch: null,
	autoFill: false,
	width: 0,
	multiple: false,
	multipleSeparator: ", ",
	highlight: function(value, term) {
		return value.replace(new RegExp("(?![^&;]+;)(?!<[^<>]*)(" + term.replace(/([\^\$\(\)\[\]\{\}\*\.\+\?\|\\])/gi, "\\$1") + ")(?![^<>]*>)(?![^&;]+;)", "gi"), "<strong>$1</strong>");
	},
    scroll: true,
    scrollHeight: 180
};

$.Autocompleter.Cache = function(options) {

	var data = {};
	var length = 0;
	
	function matchSubset(s, sub) {
		if (!options.matchCase) 
			s = s.toLowerCase();
		var i = s.indexOf(sub);
		if (i == -1) return false;
		return i == 0 || options.matchContains;
	};
	
	function add(q, value) {
		if (length > options.cacheLength){
			flush();
		}
		if (!data[q]){ 
			length++;
		}
		data[q] = value;
	}
	
	function populate(){
		if( !options.data ) return false;
		// track the matches
		var stMatchSets = {},
			nullData = 0;

		// no url was specified, we need to adjust the cache length to make sure it fits the local data store
		if( !options.url ) options.cacheLength = 1;
		
		// track all options for minChars = 0
		stMatchSets[""] = [];
		
		// loop through the array and create a lookup structure
		for ( var i = 0, ol = options.data.length; i < ol; i++ ) {
			var rawValue = options.data[i];
			// if rawValue is a string, make an array otherwise just reference the array
			rawValue = (typeof rawValue == "string") ? [rawValue] : rawValue;
			
			var value = options.formatMatch(rawValue, i+1, options.data.length);
			if ( value === false )
				continue;
				
			var firstChar = value.charAt(0).toLowerCase();
			// if no lookup array for this character exists, look it up now
			if( !stMatchSets[firstChar] ) 
				stMatchSets[firstChar] = [];

			// if the match is a string
			var row = {
				value: value,
				data: rawValue,
				result: options.formatResult && options.formatResult(rawValue) || value
			};
			
			// push the current match into the set list
			stMatchSets[firstChar].push(row);

			// keep track of minChars zero items
			if ( nullData++ < options.max ) {
				stMatchSets[""].push(row);
			}
		};

		// add the data items to the cache
		$.each(stMatchSets, function(i, value) {
			// increase the cache size
			options.cacheLength++;
			// add to the cache
			add(i, value);
		});
	}
	
	// populate any existing data
	setTimeout(populate, 25);
	
	function flush(){
		data = {};
		length = 0;
	}
	
	return {
		flush: flush,
		add: add,
		populate: populate,
		load: function(q) {        
			if (!options.cacheLength || !length)
				return null;
			/* 
			 * if dealing w/local data and matchContains than we must make sure
			 * to loop through all the data collections looking for matches
			 */
			if( !options.url && options.matchContains ){
				// track all matches
				var csub = [];
				// loop through all the data grids for matches
				for( var k in data ){
					// don't search through the stMatchSets[""] (minChars: 0) cache
					// this prevents duplicates
					if( k.length > 0 ){
						var c = data[k];                        
						$.each(c, function(i, x) {
							// if we've got a match, add it to the array
							if (matchSubset(x.value, q)) {
								csub.push(x);
							}
						});
					}
				}				
				return csub;
			} else 
			// if the exact item exists, use it
			if (data[q]){
				return data[q];
			} else
			if (options.matchSubset) {
				for (var i = q.length - 1; i >= options.minChars; i--) {
					var c = data[q.substr(0, i)];                    
					if (c) {
						var csub = [];
						$.each(c, function(i, x) {
							if (matchSubset(x.value, q)) {
								csub[csub.length] = x;
							}
						});
						return csub;
					}
				}
			}
			return null;
		}
	};
};

$.Autocompleter.Select = function (options, input, select, config) {
	var CLASSES = {
		ACTIVE: "ac_over"
	};
	
	var listItems,
		active = -1,
		data,
		term = "",
		needsInit = true,
		element,
		list;
	
	// Create results
	function init() {
		if (!needsInit)
			return;
		element = $("<div/>")
		.hide()
		.addClass(options.resultsClass)
		.css("position", "absolute")
		.appendTo(document.body);

	
		list = $("<ul>").appendTo(element).mouseover( function(event) {
			if(target(event).nodeName && target(event).nodeName.toUpperCase() == 'LI') {
	            active = $("li", list).removeClass(CLASSES.ACTIVE).index(target(event));
			    $(target(event)).addClass(CLASSES.ACTIVE);            
	        }
		}).click(function(event) {
       		$(target(event)).addClass(CLASSES.ACTIVE);
			select();
			input.focus();
			return false;
		}).mousedown(function() {
			config.mouseDownOnSelect = true;
		}).mouseup(function() {
			config.mouseDownOnSelect = false;
		});
		
		if( options.width > 0 )
			element.css("width", options.width);
			
		needsInit = false;
	} 
	
	function target(event) {
		var element = event.target;
		while(element && element.tagName != "LI")
			element = element.parentNode;
		// more fun with IE, sometimes event.target is empty, just ignore it then
		if(!element)
			return [];
		return element;
	}

	function moveSelect(step) {
		listItems.slice(active, active + 1).removeClass(CLASSES.ACTIVE);
		movePosition(step);
        var activeItem = listItems.slice(active, active + 1).addClass(CLASSES.ACTIVE);
        if(options.scroll) {
            var offset = 0;
            listItems.slice(0, active).each(function() {
				offset += this.offsetHeight;
			});
            if((offset + activeItem[0].offsetHeight - list.scrollTop()) > list[0].clientHeight) {
                list.scrollTop(offset + activeItem[0].offsetHeight - list.innerHeight());
            } else if(offset < list.scrollTop()) {
                list.scrollTop(offset);
            }
        }
	};
	
	function movePosition(step) {
		active += step;
		if (active < 0) {
			active = listItems.size() - 1;
		} else if (active >= listItems.size()) {
			active = 0;
		}
	}
	
	function limitNumberOfItems(available) {
		return options.max && options.max < available
			? options.max
			: available;
	}
	
	function fillList() {
		list.empty();
		var max = limitNumberOfItems(data.length);
		for (var i=0; i < max; i++) {
			if (!data[i])
				continue;
			var formatted = options.formatItem(data[i].data, i+1, max, data[i].value, term);
			if ( formatted === false )
				continue;
			var li = $("<li>").html( options.highlight(formatted, term) ).addClass(i%2 == 0 ? "ac_event" : "ac_odd").appendTo(list)[0];
			$.data(li, "ac_data", data[i]);
		}
		listItems = list.find("li");
		if ( options.selectFirst ) {
			listItems.slice(0, 1).addClass(CLASSES.ACTIVE);
			active = 0;
		}
		list.bgiframe();
	}
	
	return {
		display: function(d, q) {
       
			init();
			data = d;
			term = q;
			fillList();
		},
		next: function() {
			moveSelect(1);
		},
		prev: function() {
			moveSelect(-1);
		},
		pageUp: function() {
			if (active != 0 && active - 8 < 0) {
				moveSelect( -active );
			} else {
				moveSelect(-8);
			}
		},
		pageDown: function() {
			if (active != listItems.size() - 1 && active + 8 > listItems.size()) {
				moveSelect( listItems.size() - 1 - active );
			} else {
				moveSelect(8);
			}
		},
		hide: function() {
			element && element.hide();
			active = -1;
		},
		visible : function() {
			return element && element.is(":visible");
		},
		current: function() {
			return this.visible() && (listItems.filter("." + CLASSES.ACTIVE)[0] || options.selectFirst && listItems[0]);
		},
		show: function() {
			var offset = $(input).offset();
			element.css({
				width: typeof options.width == "string" || options.width > 0 ? options.width : $(input).width(),
				top: offset.top + input.offsetHeight,
				left: offset.left
			}).show();
            if(options.scroll) {
                list.scrollTop(0);
                list.css({
					maxHeight: options.scrollHeight,
					overflow: 'auto'
				});
				
                if($.browser.msie && typeof document.body.style.maxHeight === "undefined") {
					var listHeight = 0;
					listItems.each(function() {
						listHeight += this.offsetHeight;
					});
					var scrollbarsVisible = listHeight > options.scrollHeight;
                    list.css('height', scrollbarsVisible ? options.scrollHeight : listHeight );
					if (!scrollbarsVisible) {
						// IE doesn't recalculate width when scrollbar disappears
						listItems.width( list.width() - parseInt(listItems.css("padding-left")) - parseInt(listItems.css("padding-right")) );
					}
                }
                
            }
		},
		selected: function() {
			var selected = listItems && listItems.filter("." + CLASSES.ACTIVE).removeClass(CLASSES.ACTIVE);
			return selected && selected.length && $.data(selected[0], "ac_data");
		},
		emptyList: function (){
			list && list.empty();
		},
		unbind: function() {
			element && element.remove();
		}
	};
};

$.Autocompleter.Selection = function(field, start, end) {
	if( field.createTextRange ){
		var selRange = field.createTextRange();
		selRange.collapse(true);
		selRange.moveStart("character", start);
		selRange.moveEnd("character", end);
		selRange.select();
	} else if( field.setSelectionRange ){
		field.setSelectionRange(start, end);
	} else {
		if( field.selectionStart ){
			field.selectionStart = start;
			field.selectionEnd = end;
		}
	}
	field.focus();
};

})(jQuery);


/* End of jquery-autocomplete */



/* Start of custom js code */
    
    
    
    var resultPanelAnimValue = 'fade=1,height=310px'; //style is used to set Result panel's Fade effect & Height
    var searchTextDefault= 'Search';    

	if(animatedcollapse != null)	{
		animatedcollapse.addDiv('search_result_pane', resultPanelAnimValue);	
		animatedcollapse.init();
	}
	
	function toggleShowHide(event, isShow, isClose) {
      	var objSearchBox = document.getElementById('navwidettext');
        			
        			
        if(isClose == true){
            objSearchBox.value = "";
            objSearchBox.focus();
            $("#close").css("display","none");
            
            animatedcollapse.hide('search_result_pane');
            return ;
        }
		if(objSearchBox.value != ""){            
			if(isShow == true){	
                $("#close").css("display","block");
                
                
            	animatedcollapse.show('search_result_pane');              
                              
                //setTimeout('initiateFragmentSelect()', 250);
			}
			else{
               		var objElem = null;
			objElem = event.target;
			var isClickOnParent = getParentById(objElem, "nav_container");
              		if(!isClickOnParent){
                    animatedcollapse.hide('search_result_pane');                    
                    objSearchBox.blur();
                }
			}
            gosetGoogleLink(objSearchBox);
		}
		if(objSearchBox.value == ""){
            animatedcollapse.hide('search_result_pane');
            $("#close").css("display","none");
            
            objElem = event.target;
            var isClickOnParent = getParentById(objElem, "nav_container");
          
            if(!isClickOnParent)
            {
                objSearchBox.value = searchTextDefault;
                objSearchBox.blur();
            }
            else
            {
                objSearchBox.focus();
            }
            
		}		
	}	
	
	function getParentById(el, parentId) {

		if (el == null) return false;
		else if (el.nodeType == 1 && el.id.toLowerCase() == parentId.toLowerCase())	// Gecko bug, supposed to be uppercase
			return true;
		else
			return getParentById(el.parentNode, parentId);
	}
	
	// below code added for select icon by click

	var currentImageSelected = "";
	
	function showOver(thisTag){
	 var mySrc = thisTag.src;
	 if(currentImageSelected=="" && mySrc.indexOf("_over.gif")!=-1){
	  currentImageSelected = mySrc;
	  return;
	 } else if(mySrc.indexOf("_over.gif")==-1){
    mySrc = mySrc.substring(0,mySrc.indexOf(".gif")) + "_over.gif";
   } else if(currentImageSelected!=mySrc) {
    mySrc = mySrc.substring(0,mySrc.indexOf("_over.gif")) + ".gif";
   }
   thisTag.src = mySrc;
	}
  
	function clickLinks(thisTag) {		
		//var navDivNodes = thisTag.parentNode.parentNode.parentNode.childNodes;		
		var navDivNodes = getChildNodes(thisTag.parentNode.parentNode.parentNode)
		
		for(var j=0; j<navDivNodes.length; j++){			
	         if(navDivNodes[j].innerHTML != '' && navDivNodes[j].getElementsByTagName('ul')[0]){                
                navDivNodes[j].getElementsByTagName('ul')[0].style.display ="none";
                var mySrc = navDivNodes[j].getElementsByTagName('img')[0].src;
                if(mySrc.indexOf("_over.gif")!=-1){
                 mySrc = mySrc.substring(0,mySrc.indexOf("_over.gif")) + ".gif";
                 navDivNodes[j].getElementsByTagName('img')[0].src = mySrc;
                }			
			}
		}
		thisTag.parentNode.parentNode.getElementsByTagName('ul')[0].style.display ="block"  ;
		var mySrc = thisTag.src;
    if(mySrc.indexOf("_over.gif")==-1){
     currentImageSelected = "";
     mySrc = mySrc.substring(0,mySrc.indexOf(".gif")) + "_over.gif";
     thisTag.src = mySrc;
    }	
	}
	
	/* Find Child Node Of parent node with ignore Comments, Text and White Spaces */
	function isAllWs( nod )
	{
	  return !(/[^\t\n\r ]/.test(nod.data));
	}
	function isIgnorableChild( nod )
	{
	  return ( nod.nodeType == 8) || // A comment node
	         ( (nod.nodeType == 3) && isAllWs(nod) ); // a text node, all ws
	}
	function getChildNodes(objNode) {
		var arryList = [];
		if(objNode) {
		var childList = objNode.childNodes;
			for(var i=0; i<childList.length; i++) {
				if (!isIgnorableChild(childList[i])) {
					arryList[arryList.length] = childList[i]
				}
			}
		}
		return arryList;
	}
    
    function chekAllResponseDone(fregmentLength) {
		intTotalResponse = intTotalResponse + 1;	
			
		if(fregmentLength>7) fregmentLength=7;
		if(intTotalResponse<=7 && intTotalResponse==fregmentLength && fregmentLength <=7){	
			initiateFragmentSelect();
		}
	}

	function initiateFragmentSelect()
    {
        for(var m=0; m<7; m++){	            			
	     //var elemFirstFragment = getChildNodes(firstFragmentBlock[m]);
		var objDiv = document.getElementById('nav_placeholder_'+m);

		if(objDiv && objDiv.innerHTML != "") {
			var childList = getChildNodes(objDiv);
			
			
			for(var c=0; c<childList.length; c++) {
				//if(c==0) childList[c].style.backgroundColor = "blue";
				if(c==0) {
					var mySrc = $("#" + "nav_placeholder_" + m + " img").attr("src");
					mySrc = mySrc.substring(0,mySrc.indexOf(".gif")) + "_over.gif";
					$("#" + "nav_placeholder_" + m + " img").attr("src",mySrc);
					currentImageSelected = mySrc;
				}
				if(c==1) childList[c].style.display="block";
                }
			break;
            }

        }
    }

    function makeTextBoxBlank(objTextBox) {
         if(objTextBox.value==searchTextDefault)
        {
            objTextBox.value = "";
        }
    }

function gosetGoogleLink(txtBox) {    
    var googleLink = document.getElementById("googleLinkTag");    
    var googleLinkTop = document.getElementById("googleLinkTagTop");
    
    var constantURL = "/beta/home/chase-search-results&q=" + txtBox.value + "&emptyQueryText=false";
    
    if(txtBox.value != null && txtBox.value != ""){
        googleLink.href = constantURL;
        googleLinkTop.href = constantURL;
    }
    
} 

/* JQuery Document Ready Function and haveDefault variable required for navigation widget: Start*/
$().ready(function()	{
	try	{
		if($("#navwidettext").get(0) != null)	{
			NavigationSearch.getNavigationJSObjects(
				function(data)	{
					$("#navwidettext").autocomplete(data,	{
							minChars: 0,
							width: 310,
							matchContains: true,
							autoFill: false,
							delay: 400,
							formatItem: function(row, i, max)	{
								return "" + row.keyword;
							}
						}
					);

					for(var counter_key=0; counter_key < data.length; counter_key++)
					{
						if('default_nav_key'== data[counter_key].keyword)
						{
							haveDefault=true;
							break;
						}
					}
				},
				function(errorString, exception) {}
			);
			$("#navwidettext").bind("keyup",function(event){toggleShowHide(event, true,false);});
			$("#navwidettext").bind("focus",function(event){makeTextBoxBlank(this);});
			$("#close").bind("click",function(event){toggleShowHide(event, true, true);});
			$(document).bind('mousedown', function(event){toggleShowHide(event, false, false); });
			//currentImageSelected = $("#nav_placeholder_0 img[src*=_over]").attr("src");
			$('#navwidettext').css("visibility", "visible");
			setInterval ( "set_rand_identifier()", (60*60*1000) );
		}
	}
	catch(err)
	{

	}

}
);
var haveDefault=false;

/* JQuery Document Ready Function and haveDefault variable required for navigation widget: End */

/*****************************************************	SEARCH NAVIGATION WIDGET: END		*************************************************************/
/********************************************************************************************************************************************************/




/********************************************************************************************************************************************************/
/*****************************************************		LOGIN WIDGET: START				*************************************************************/

var varDOMAIN = "";
var varLOB="";

// varMFAURL : This variable is used to enter the src for the loginframe
var varMFAURL = "https://mfasa.chase.com/auth/login.html";

/*
varForgetPasswordUrl: This variable is used to generate the forget password url.
Note that the value of LOB will be updated dynamically
*/
var varForgetPasswordUrl = "https://chaseonline.chase.com/Public/ReIdentify/ReidentifyFilterView.aspx?LOB=";

// varGenericLoginFragment: Path of the generic login fragment
var varGenericLoginFragment = "/ccpmweb/beta/document/generic_login_fragment.html";

/*
    varAjaxError : html to be shown when there is no response or error in ajax call
    for generic login fragment.
    Change the error image/message as required.
*/
var varAjaxError = "<div id='ajaxerror'><a href='https://chaseonline.chase.com/online/home/sso_co_home.jsp' class='outageLink'>this link</a></div>";

var vEditableOptionIndex_A = 0;
var seltext="User ID";
var myarr=null;

var _userId = "";
var _password = "";
var _password = "";
var _lob = "";
var _cookieDomain = "";


var _reTryInterval = 1000;
var _maxReTryCount = 5;
var reTryCount=0;

/*
This function updates the various html elements with appropriate values such as LOB and MFAUrl
It is called from the generic_login_fragment.html
*/
function includeParam() 
{   
    $('#auth_externalData').get(0).value=$('#auth_externalData').get(0).value + varLOB;
	$('#lnk_forgotpswd').get(0).href= varForgetPasswordUrl + varLOB;
    $('#loginframe').get(0).src= varMFAURL;
}

/*
This function sets the values of domain and lob. The values are passed by the
content author in the article for login widget where this function is called.
The function also fetches the generic_login_fragment.html using ajax calls through jquery.
The path of the html need to be updated in case the content path is changed.
*/
function loadLoginHtml(domain,lob) {
        varDOMAIN=domain;
        varLOB=lob;
        $.ajax({
                    url: varGenericLoginFragment,
                    cache: false,
                    success: function(data)
                    {
                        $("#logOnWidget").html(data);
                    },
                    error: function(data)
                    {
                        $("#logOnWidget").html(varAjaxError);
                    }
                });
}

function bolInfoIconPopup(aURL)
{
	var newWin = window.open(aURL,"bol","scrollbars=yes,screenX=0,screenY=0,directories=0,height=300,width=500,location=no,menubar=no,resizable=yes,status=no,toolbar=no");
	newWin.focus();
}

function validateAndSubmitFrame() 
{

	reTryCount++;
	var iframe;
	var iframeDoc;
	var iframeForm;
	var siteId = "COL";
	var errorUrl = "https://chaseonline.chase.com";
        document.domain = _cookieDomain.substring(1, _cookieDomain.length);
	if(_cookieDomain == ".cardmemberservices.com")
	{
		siteId = "CMS";
		errorUrl = "https://online.cardmemberservices.com";
	}
	try
	{
		if (document.all) 
		{
			iframe = document.getElementById("loginframe");
			iframeDoc = iframe.contentDocument || ( iframe.contentWindow && iframe.contentWindow.document ); /*LINE MODIFIED TO GET IFRAME DOCUMENT CORRECTLY FOR IE9 FIX*/
			iframeForm = iframeDoc.getElementById("login");
		}
		else 
		{
			iframe = window.frames['loginframe'];
			iframeDoc = iframe.document;   
			iframeForm = iframeDoc.login;
		}


		iframeForm.auth_siteId.value = siteId;
		iframeForm.auth_userId.value = _userId;
		iframeForm.auth_passwd.value = _password;
		iframeForm.auth_passwd_org.value = _password_org;
		iframeForm.LOB.value = _lob;
		iframeForm.auth_externalData.value ='LOB='+_lob;
		iframeForm.submit()
	}
	catch(e)
	{
		//Check for IE9 cross window security violations and use cross-window messaging instead
		var errorMsg = e.message.toLowerCase();
		if(errorMsg.indexOf("denied") >= 0){
			sendSubmitFrameMessage(siteId);
		} else {
			handleValidateAndSubmitFrameError();
		}
	}

	return(false);
}
 
/*FUNCTION ADDED FOR IE9 FIX*/
function sendSubmitFrameMessage(siteId){
	try
	{
		var messageData = '[{"siteId": "' + siteId + '", "userId": "' + _userId + '", "password": "' + _password + '", "password_org": "' + _password_org + '", "lob": "' + _lob + '", "auth_externalData": "LOB=' + _lob + '", "parentWindowLocation": "' + document.location + '"}]';
		var win = document.getElementById("loginframe").contentWindow;
		win.postMessage(messageData, '*');
	}
	catch(e)
	{
		handleValidateAndSubmitFrameError();
	}
} 

/*FUNCTION ADDED FOR IE9 FIX*/
function handleValidateAndSubmitFrameError(){
	var errorUrl = "https://chaseonline.chase.com";
        document.domain = _cookieDomain.substring(1, _cookieDomain.length);
	if(_cookieDomain == ".cardmemberservices.com")
	{
		siteId = "CMS";
		errorUrl = "https://online.cardmemberservices.com";
	}
	if(reTryCount >= _maxReTryCount)
		{ 
/* added for WO 110813  */					
		errorUrl = errorUrl+"/Logon.aspx?error=L009&LOB="+_lob+"&src="+encodeURIComponent(window.location.href);
		/*  end added for WO 110813 */			
document.location=errorUrl;
		}
		else
		{
			setTimeout("validateAndSubmitFrame()",_reTryInterval);
		}
}

function validateandsetcookie(userID, pwd, remember_me)
{
var	domain=varDOMAIN;
var	lob=varLOB;

	if(reTryCount == 0)
	{

		if((userID.value.length==0 || userID.value == seltext) && (pwd.length==0))
		{
			alert("Error Message LO001:\nPlease enter both your User ID and Password.");
			return false;
		}

        if(userID.value== pwd)
		{
			alert("Error Message LO001:\nPlease enter a Password that is different from your User ID.");
			return false;
		}
        
		chk1 = uidcheck(userID.value);
		chk2=pwdcheck(pwd);
        
		if((chk1==0) && (chk2==0))
		{	
			userID.value = userID.value.toLowerCase();
			setRememberMeCookie(remember_me, domain);
			saveVanityRedirectCookie(domain);
			_userId = userID.value.toLowerCase();
			_password = pwd.toLowerCase();
			_password_org = pwd;
			_lob = lob;
			_cookieDomain = domain;

			validateAndSubmitFrame();
		}
	}
    return false;
}


function uidcheck(userId)
{	
	ulen=userId.length;
	uidval=userId;
	var flag1=0;
	var alphaNumericStr = "abcdefghijklmnopqrstuvwxyz0123456789_";
		
	if(ulen==0 || uidval == seltext)
	{
		alert("Error Message LO001:\nPlease enter both your User ID and Password.");
		return 1;	
	}	
	
	if(!(ulen<=32))
	{
		alert("Error Message LO001:\nThe User ID you entered is not valid. \nYour User ID needs to be less than 32 characters long.")
		return 1;
	}
	
	for (i=0;i<uidval.length;i++)
	{
		if (!(alphaNumericStr.indexOf(uidval.substring(i,i+1).toLowerCase() ) >= 0))
		{	
			flag1=1;
		}
	}

	if(flag1==1)
	{	
		alert("Error Message LO011:\nThe User ID and/or Password you entered is not valid.\nYour User ID and Password must consist only of letters and numbers.");
		return 1;
	}
		
	return 0;	
}


function pwdcheck(pwd)
{	
	pspace=0;
	plen=pwd.length;
	if(plen==0)
	{
		alert("Error Message LO001:\nPlease enter both your User ID and Password.");
		return 1;		
	}
	
		
	else if(plen>32)
	{
		alert("Password needs to be less than 32 characters long.Please re-enter Password");		
		return 1;
//	}

//	for (i=0;i<pwd.length;i++)
//	{
//		if (pwd.charAt(i)==" ")
//		{	
//			pspace=1
//		}
//	}
//	if(pspace==1)
//	{
//	alert("Password cannot contain spaces");
//	return 1;
	}
	
	return 0;	
}

function setRememberMeCookie(remeber_me, domain)
{
	if(remeber_me==true)
	{
        document.cookie = "_tmprememberme=1;path=/;domain="+domain;
	}
	else
	{
		document.cookie = "_tmprememberme=0;expires=0;path=/;domain="+domain;
	}
}

		
	var remflag1=0
	if(document.cookie.match("_rememberme"))
	{	
		ckval=readCookie("_rememberme");
		if (ckval==null || ckval.substr(0,1)==";") {ckval="";} // Added Firefox compatibility -- blanked cookies are stored as "[cookiename]=;"
		remflag1=(ckval==null)?0:1;
		myarr = new Array(1);
		var arr=ckval.split("|");
		myarr[0] = arr[0];
	}


function showAll(userid,remember_me)
{		
    chkbox = document.logonform.remember;
    if(myarr!=null && remflag1==1)
    {
        userid.value = myarr[0]; //converted from dropdown to single field
        chkbox.checked=true;												
    }	
    else if(myarr==null)
    {
        userid.value=seltext;
        chkbox.checked=false;
    }

    try {
        if(myarr[0]==null || myarr[0]=="")
        {
            chkbox.checked=false;
        }
    }
    catch(err) {
        chkbox.checked=false;
    }

}
   
   var vEditableOptionText_A = "--?--";
   var vPreviousSelectIndex_A = 0;
   // Contains the Previously Selected Index, set to 0 by default
 
   var vSelectIndex_A = 0;
   // Contains the Currently Selected Index, set to 0 by default
 
   var vSelectChange_A = 'MANUAL_CLICK';
   // Indicates whether Change in dropdown selected option
   // was due to a Manual Click
   // or due to System properties of dropdown.
 
   // vSelectChange_A = 'MANUAL_CLICK' indicates that
   // the jump to a non-editable option in the dropdown was due
   // to a Manual click (i.e.,changed on purpose by user).
 
   // vSelectChange_A = 'AUTO_SYSTEM' indicates that
   // the jump to a non-editable option was due to System properties of dropdown
   // (i.e.,user did not change the option in the dropdown;
   // instead an automatic jump happened due to inbuilt
  // dropdown properties of browser on typing of a character )


function readCookie(name) 
{
	var NameOfCookie=name;
	if (document.cookie.length > 0) 
	{ 
		begin = document.cookie.indexOf(NameOfCookie+"="); 
		if (begin != -1) // Note: != means "is not equal to"
		{ 
			begin += NameOfCookie.length+1; 
			end = document.cookie.lastIndexOf("|");
			if (end == -1) end = document.cookie.length;
				return unescape(document.cookie.substring(begin, end)); 

		} 
	}
	return null; 
}


/*
This function sets the default text of the User ID field if there is no value entered by the user.
This is called onblur of the UserID textbox in the generic_login_fragment.html
*/
function usr_nameDefaultText(usrIdField)
{
    if (usrIdField.value == '')
    {
        usrIdField.value = seltext;
    }
    
}


/*
This function clears the User ID field if the the user has not entered anything in the field.
This is called onfocus of the UserID textbox in the generic_login_fragment.html
*/
function usr_nameClearText(usrIdField)
{
    if (usrIdField.value == seltext)   
    {
        usrIdField.value = "";
    }
}

/*
This functions hides the temp password field (type=textbox) when the user clicks on it, and moves the focus to the 
actual password field (type=password).
This is called onfocus of the temp password field in the generic_login_fragment.html
This is done so as to display the plain text "Password" when the user has not entered anything in the password field,
and that the password field cannot show plain text. The text "Password" is kept in a temp password field
which is shown/hidden as required.
*/
function changeBox()
{
	$("#usr_password_tmp").css("display","none");
	$("#usr_password").css("display","");
	$("#usr_password").focus();
}

/*
This function hides the actual password field (type=password) and shows the temp password field (type=textbox), only 
if the user has not entered any password in the actual password.
This is called onblur of the actual password field in the generic_login_fragment.html
*/
function restoreBox()
{
	if(document.getElementById("usr_password").value=='')
	{
		document.getElementById("usr_password").style.display='none';
        document.getElementById("usr_password_tmp").style.display='';
	}
}



/*****************************************************		LOGIN WIDGET: END				*************************************************************/
/********************************************************************************************************************************************************/


/********************************************************************************************************************************************************/
/*****************************************************		MVT: START						*************************************************************/

/* 
	Use this Function to pass javascript file path and name to append in the page header(as a last script tag).
*/

function includeJSInHead(url)
	{
		// Include Guard
		var scripts = document.getElementsByTagName("script");
		for (var index = 0; index < scripts.length; ++index)
		{
			if (scripts[index].src == url)
			{
			  return;
			}
		}  
	  // Inclusion
	  var head = document.getElementsByTagName("head").item(0);		  
	  var script = head.appendChild(document.createElement("script"));
	  script.type = "text/javascript";
	  script.src =  url;          
	}


function includePageCSSInHead(url)
	{
		// Include Guard
		var scripts = document.getElementsByTagName("script");
		for (var index = 0; index < scripts.length; ++index)
		{
			if (scripts[index].src == url)
			{
			  return;
			}
		}  
	  // Inclusion
	  var head = document.getElementsByTagName("head").item(0);		  
	  var link = head.appendChild(document.createElement("link"));
	  link.rel = "stylesheet";
	  link.type =  "text/css";          
	  link.href = url;
	}


function openModalAtSection(_url,section_number)
{
	tb_show(null,_url, true);
	modal_section=section_number;
}

/*****************************************************		MVT: END						*************************************************************/
/********************************************************************************************************************************************************/


/********************************************************************************************************************************************************/
/*****************************************************		SURVEY WIDGET: START			*************************************************************/

/* 
This function encodes current window's url and opens new window having request parameter survey_pg_identifier equal to encoded url.
*/
function redirectToSurvey(survey_url)
{
	var queryString=window.top.location;	
	queryString = escape(queryString);	
	var seperator = "&";
	var paramStart = "?";
	var parameter_name = "survey_pg_identifier";
	
	if(survey_url.indexOf('?') != -1){
		window.open(survey_url + seperator + parameter_name + "=" + queryString);
	}
	else{		
		window.open(survey_url + paramStart + parameter_name + "=" + queryString);
	}
}

/*****************************************************		SURVEY WIDGET: END				*************************************************************/
/********************************************************************************************************************************************************/


/********************************************************************************************************************************************************/
/*****************************************************		MODAL WINDOW: START				*************************************************************/

//the path to the loading image may need to change
var tb_pathToImage = "/online/Credit-Cards/images/loadingAnimation.gif";

/*!!!!!!!!!!!!!!!!! edit below this line at your own risk !!!!!!!!!!!!!!!!!!!!!!!*/

//on page load call tb_init
$(document).ready(function(){   
	tb_init('a.thickbox, area.thickbox, input.thickbox');//pass where to apply thickbox
	imgLoader = new Image();// preload image
	imgLoader.src = tb_pathToImage;
});

//add thickbox to href & area elements that have a class of .thickbox
function tb_init(domChunk){
	$(domChunk).click(function(){
	var t = this.title || this.name || null;
	var a = this.href || this.alt;
	var g = this.rel || false;
	tb_show(t,a,g);
	this.blur();
	return false;
	});
}

function tb_show(caption, url, imageGroup) {//function called when the user clicks on a thickbox link

	try {
		if (typeof document.body.style.maxHeight === "undefined") {//if IE 6
			$("body","html").css({height: "100%", width: "100%"});
			$("html").css("overflow","hidden");
			if (document.getElementById("TB_HideSelect") === null) {//iframe to hide select elements in ie6
				$("body").append("<iframe src='javascript:false;' id='TB_HideSelect'></iframe><div id='TB_overlay'></div><div id='TB_window'></div>");
				$("#TB_overlay").click(tb_remove);
			}
		}else{//all others
			if(document.getElementById("TB_overlay") === null){
				$("body").append("<div id='TB_overlay'></div><div id='TB_window'></div>");
				$("#TB_overlay").click(tb_remove);
			}
		}
		
		if(tb_detectMacXFF()){
			$("#TB_overlay").addClass("TB_overlayMacFFBGHack");//use png overlay so hide flash
		}else{
			$("#TB_overlay").addClass("TB_overlayBG");//use background and opacity
		}
		
		if(caption===null){caption="";}
		$("body").append("<div id='TB_load'><img src="+imgLoader.src+"></div>");//add loader to the page
		$('#TB_load').show();//show loader
		
		var baseURL;
	   if(url.indexOf("?")!==-1){ //ff there is a query string involved
			baseURL = url.substr(0, url.indexOf("?"));
	   }else{ 
	   		baseURL = url;
	   }
	   
	   var urlString = /\.jpg$|\.jpeg$|\.png$|\.gif$|\.bmp$/;
	   var urlType = baseURL.toLowerCase().match(urlString);

		if(urlType == '.jpg' || urlType == '.jpeg' || urlType == '.png' || urlType == '.gif' || urlType == '.bmp'){//code to show images
				
			TB_PrevCaption = "";
			TB_PrevURL = "";
			TB_PrevHTML = "";
			TB_NextCaption = "";
			TB_NextURL = "";
			TB_NextHTML = "";
			TB_imageCount = "";
			TB_FoundURL = false;
			if(imageGroup){
				TB_TempArray = $("a[@rel="+imageGroup+"]").get();
				for (TB_Counter = 0; ((TB_Counter < TB_TempArray.length) && (TB_NextHTML === "")); TB_Counter++) {
					var urlTypeTemp = TB_TempArray[TB_Counter].href.toLowerCase().match(urlString);
						if (!(TB_TempArray[TB_Counter].href == url)) {						
							if (TB_FoundURL) {
								TB_NextCaption = TB_TempArray[TB_Counter].title;
								TB_NextURL = TB_TempArray[TB_Counter].href;
								TB_NextHTML = "<span id='TB_next'>  <a href='#'>Next ></a></span>";
							} else {
								TB_PrevCaption = TB_TempArray[TB_Counter].title;
								TB_PrevURL = TB_TempArray[TB_Counter].href;
								TB_PrevHTML = "<span id='TB_prev'>  <a href='#'>< Prev</a></span>";
							}
						} else {
							TB_FoundURL = true;
							TB_imageCount = "Image " + (TB_Counter + 1) +" of "+ (TB_TempArray.length);											
						}
				}
			}

			imgPreloader = new Image();
			imgPreloader.onload = function(){		
			imgPreloader.onload = null;
				
			// Resizing large images - orginal by Christian Montoya edited by me.
			var pagesize = tb_getPageSize();
			var x = pagesize[0] - 150;
			var y = pagesize[1] - 150;
			var imageWidth = imgPreloader.width;
			var imageHeight = imgPreloader.height;
			if (imageWidth > x) {
				imageHeight = imageHeight * (x / imageWidth); 
				imageWidth = x; 
				if (imageHeight > y) { 
					imageWidth = imageWidth * (y / imageHeight); 
					imageHeight = y; 
				}
			} else if (imageHeight > y) { 
				imageWidth = imageWidth * (y / imageHeight); 
				imageHeight = y; 
				if (imageWidth > x) { 
					imageHeight = imageHeight * (x / imageWidth); 
					imageWidth = x;
				}
			}
			// End Resizing
			
			TB_WIDTH = imageWidth + 30;
			TB_HEIGHT = imageHeight + 60;
			$("#TB_window").append("<b class='rtop'><b class='r1'></b> <b class='r2'></b> <b class='r3'></b> <b class='r4'></b></b><div id='container'><a href='' id='TB_ImageOff' title='Close'><img id='TB_Image' src='../../PSR/ccpmweb/shared/document/"+url+"' width='"+imageWidth+"' height='"+imageHeight+"' alt='"+caption+"'/></a>" + "<div id='TB_caption'>"+caption+"<div id='TB_secondLine'>" + TB_imageCount + TB_PrevHTML + TB_NextHTML + "</div></div><div id='TB_closeWindow'><a href='#' id='TB_closeWindowButton' title='Close'>Close</a> or Esc Key</div><b class='rbottom'><b class='r4'></b> <b class='r3'></b> <b class='r2'></b> <b class='r1'></b></b></div>"); 		
			
			$("#TB_closeWindowButton").click(tb_remove);
			
			if (!(TB_PrevHTML === "")) {
				function goPrev(){
					if($(document).unbind("click",goPrev)){$(document).unbind("click",goPrev);}
					$("#TB_window").remove();
					$("body").append("<div id='TB_window'></div>");
					tb_show(TB_PrevCaption, TB_PrevURL, imageGroup);
					return false;	
				}
				$("#TB_prev").click(goPrev);
			}
			
			if (!(TB_NextHTML === "")) {		
				function goNext(){
					$("#TB_window").remove();
					$("body").append("<div id='TB_window'></div>");
					tb_show(TB_NextCaption, TB_NextURL, imageGroup);				
					return false;	
				}
				$("#TB_next").click(goNext);
				
			}

			document.onkeydown = function(e){ 	
				if (e == null) { // ie
					keycode = event.keyCode;
				} else { // mozilla
					keycode = e.which;
				}
				if(keycode == 27){ // close
					tb_remove();
				} else if(keycode == 190){ // display previous image
					if(!(TB_NextHTML == "")){
						document.onkeydown = "";
						goNext();
					}
				} else if(keycode == 188){ // display next image
					if(!(TB_PrevHTML == "")){
						document.onkeydown = "";
						goPrev();
					}
				}	
			};
			
			tb_position();
			$("#TB_load").remove();
			$("#TB_ImageOff").click(tb_remove);
			$("#TB_window").css({display:"block"}); //for safari using css instead of show
			};
			
			imgPreloader.src = url;
		}else{//code to show html
			
			var queryString = url.replace(/^[^\?]+\??/,'');
			var params = tb_parseQuery( queryString );

			TB_WIDTH = (params['width']*1) + 30 || 630; //defaults to 630 if no paramaters were added to URL
			TB_HEIGHT = (params['height']*1) + 40 || 440; //defaults to 440 if no paramaters were added to URL
			ajaxContentW = TB_WIDTH - 30;
			ajaxContentH = TB_HEIGHT - 45;
			
			if(url.indexOf('TB_iframe') != -1){// either iframe or ajax window		
					urlNoQuery = url.split('TB_');
					$("#TB_iframeContent").remove();
					if(params['modal'] != "true"){//iframe no modal
						$("#TB_window").append("<b class='rtop'><b class='r1'></b> <b class='r2'></b> <b class='r3'></b> <b class='r4'></b></b><div id='container'><iframe frameborder='0' hspace='0' src='"+urlNoQuery[0]+"' id='TB_iframeContent' name='TB_iframeContent"+Math.round(Math.random()*1000)+"' onload='tb_showIframe()' style='width:"+(ajaxContentW + 29)+"px;height:"+(ajaxContentH + 17)+"px;'> </iframe><b class='rbottom'><b class='r4'></b> <b class='r3'></b> <b class='r2'></b> <b class='r1'></b></b></div>");
					}else{//iframe modal
					$("#TB_overlay").unbind();
						$("#TB_window").append("<b class='rtop'><b class='r1'></b> <b class='r2'></b> <b class='r3'></b> <b class='r4'></b></b><div id='container'><iframe frameborder='0' hspace='0' src='"+urlNoQuery[0]+"' id='TB_iframeContent' name='TB_iframeContent"+Math.round(Math.random()*1000)+"' onload='tb_showIframe()' style='width:"+(ajaxContentW + 29)+"px;height:"+(ajaxContentH + 17)+"px;'> </iframe><b class='rbottom'><b class='r4'></b> <b class='r3'></b> <b class='r2'></b> <b class='r1'></b></b></div>");
					}
			}else{// not an iframe, ajax
					if($("#TB_window").css("display") != "block"){
						if(params['modal'] != "true"){//ajax no modal
						$("#TB_window").append("<b class='rtop'><b class='r1'></b> <b class='r2'></b> <b class='r3'></b> <b class='r4'></b></b><div id='container'><div id='TB_title'><div id='TB_ajaxWindowTitle'>"+caption+"</div><div id='TB_closeAjaxWindow'><a href='#' id='TB_closeWindowButton'>close</a> or Esc Key</div></div><div id='TB_ajaxContent' style='width:"+ajaxContentW+"px;height:"+ajaxContentH+"px'></div><b class='rbottom'><b class='r4'></b> <b class='r3'></b> <b class='r2'></b> <b class='r1'></b></b></div>");
						}else{//ajax modal
						$("#TB_overlay").unbind();
						$("#TB_window").append("<b class='rtop'><b class='r1'></b> <b class='r2'></b> <b class='r3'></b> <b class='r4'></b></b><div id='container'><div id='TB_ajaxContent' class='TB_modal' style='width:"+ajaxContentW+"px;height:"+ajaxContentH+"px;'></div><b class='rbottom'><b class='r4'></b> <b class='r3'></b> <b class='r2'></b> <b class='r1'></b></b></div>");	
						}
					}else{//this means the window is already up, we are just loading new content via ajax
						$("#TB_ajaxContent")[0].style.width = ajaxContentW +"px";
						$("#TB_ajaxContent")[0].style.height = ajaxContentH +"px";
						$("#TB_ajaxContent")[0].scrollTop = 0;
						$("#TB_ajaxWindowTitle").html(caption);
					}
			}
					
			$("#TB_closeWindowButton").click(tb_remove);
			
				if(url.indexOf('TB_inline') != -1){	
					$("#TB_ajaxContent").append($('#' + params['inlineId']).children());
					$("#TB_window").unload(function () {
						$('#' + params['inlineId']).append( $("#TB_ajaxContent").children() ); // move elements back when you're finished
					});
					tb_position();
					$("#TB_load").remove();
					$("#TB_window").css({display:"block"}); 
				}else if(url.indexOf('TB_iframe') != -1){
					tb_position();
					if($.browser.safari){//safari needs help because it will not fire iframe onload
						$("#TB_load").remove();
						$("#TB_window").css({display:"block"});
					}
				}else{
					$("#TB_ajaxContent").load(url += "&random=" + (new Date().getTime()),function(){//to do a post change this load method
						tb_position();
						$("#TB_load").remove();
						tb_init("#TB_ajaxContent a.thickbox");
						$("#TB_window").css({display:"block"});
					});
				}
			
		}

		if(!params['modal']){
			document.onkeyup = function(e){ 	
				if (e == null) { // ie
					keycode = event.keyCode;
				} else { // mozilla
					keycode = e.which;
				}
				if(keycode == 27){ // close
					tb_remove();
				}	
			};
		}
		
	} catch(e) {
		//nothing here
	}
}

//helper functions below
function tb_showIframe(){
	$("#TB_load").remove();
	$("#TB_window").css({display:"block"});
}

function tb_remove() {
 	$("#TB_imageOff").unbind("click");
	$("#TB_closeWindowButton").unbind("click");
	$("#TB_window").fadeOut("fast",function(){$('#TB_window,#TB_overlay,#TB_HideSelect').trigger("unload").unbind().remove();});
	$("#TB_load").remove();
	if (typeof document.body.style.maxHeight == "undefined") {//if IE 6
		$("body","html").css({height: "auto", width: "auto"});
		$("html").css("overflow","");
	}
	document.onkeydown = "";
	document.onkeyup = "";
	return false;
}

function tb_position() {
$("#TB_window").css({marginLeft: '-' + parseInt((TB_WIDTH / 2),10) + 'px', width: TB_WIDTH + 'px'});
	if ( !(jQuery.browser.msie && jQuery.browser.version < 7)) { // take away IE6
		$("#TB_window").css({marginTop: '-' + parseInt((TB_HEIGHT / 2),10) + 'px'});
	}
}

function tb_parseQuery ( query ) {
   var Params = {};
   if ( ! query ) {return Params;}// return empty object
   var Pairs = query.split(/[;&]/);
   for ( var i = 0; i < Pairs.length; i++ ) {
      var KeyVal = Pairs[i].split('=');
      if ( ! KeyVal || KeyVal.length != 2 ) {continue;}
      var key = unescape( KeyVal[0] );
      var val = unescape( KeyVal[1] );
      val = val.replace(/\+/g, ' ');
      Params[key] = val;
   }
   return Params;
}

function tb_getPageSize(){
	var de = document.documentElement;
	var w = window.innerWidth || self.innerWidth || (de&&de.clientWidth) || document.body.clientWidth;
	var h = window.innerHeight || self.innerHeight || (de&&de.clientHeight) || document.body.clientHeight;
	arrayPageSize = [w,h];
	return arrayPageSize;
}

function tb_detectMacXFF() {
  var userAgent = navigator.userAgent.toLowerCase();
  if (userAgent.indexOf('mac') != -1 && userAgent.indexOf('firefox')!=-1) {
    return true;
  }
}

/*****************************************************		MODAL WINDOW: END				*************************************************************/
/********************************************************************************************************************************************************/

/********************************************************************************************************************************************************/
/*****************************************************		JOIN/LEAVE BETA: START			*************************************************************/

function leaveBeta(url){
	var B=new Date((new Date()).getTime()+(3*30*1000*60*60*24));
	document.cookie="redirector="+escape("optout")+";expires="+B.toGMTString()+";path=/";
	document.location=url!=null?url:"/";
}

function joinBeta(url){
	var B=new Date((new Date()).getTime()+(3*30*1000*60*60*24));
	document.cookie="redirector="+escape("betavisitor")+";expires="+B.toGMTString()+";path=/";
	document.location=url!=null?url:"/";
}

/*****************************************************		JOIN/LEAVE BETA: END			*************************************************************/
/********************************************************************************************************************************************************/
