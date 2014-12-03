var cookie = require('ep_etherpad-lite/static/js/pad_cookie').padcookie;
var _ = require('ep_etherpad-lite/static/js/underscore');
var optionsAlreadyRecovered = false;

if(typeof exports == 'undefined'){
  var exports = this['mymodule'] = {};
}

var lintLog = function(value, level){
  $('#options-custom-style-lint').append("<span class=\"lint" + level + "\">" + value.replace(/ /g, "&nbsp;") + "</span><br>");
}

exports.postAceInit = function(hook, context){
  // Listener events
  $('body').on("click", "#options-custom-style-save", function(){
    var padId = pad.getPadId();
    var styleId = $('#options-custom-style-name').val();
    var css = $('#options-custom-style-css').val();
    customStyles.styles.new(padId, styleId, css);
    pad.collabClient.sendMessage(message);
  });

  // Listen for a click of the paintbrush icon to bring up the popup
  $('body').on('click', '.ep_custom_styles', function(){
    padeditbar.toggleDropDown("customStyles");
  });

  // When the Style ID is changed
  $('body').on('change', '#options-custom-style-name', function(){ 
    $('#options-custom-style-status').text("");
  });

  // When the style CSS is changed we lint it and provide feedback
  $('body').on('keyup', '#options-custom-style-css', function(){ 
    if( $('#options-custom-style-css').val().length === 0 ) return;
    var results = CSSLint.verify($('#options-custom-style-css').val());
    var messages = results.messages;
    if(messages.length === 0){
      $('#options-custom-style-lint').html("<span class='lintokay'>OK</span>");
    }else{
      $('#options-custom-style-lint').html("");
    }
    for (i=0, len=messages.length; i < len; i++) {
      lintLog(messages[i].message + " (line " + messages[i].line + ", col " + messages[i].col + ")", messages[i].type);
    }
  });

  // This can be trashed.
  $('#availableStyles').on('change', 'p > input', function(){
    var styleId = $(this).context.id;
    var value = $(this).context.checked;
    if(!styleId) return;

    var rep = {};
    context.ace.callWithAce(function (ace){
      var saveRep = ace.ace_getRep();
      rep.selStart = saveRep.selStart;
      rep.selEnd = saveRep.selEnd;
    },'customStyles', true);

    if (rep.selStart[0] == rep.selEnd[0] && rep.selStart[1] == rep.selEnd[1]) {
      console.log("nothing selected");
      return;
    }

    context.ace.callWithAce(function (ace){
console.log("setting with rep", styleId);
      ace.ace_performSelectionChange(rep.selStart,rep.selEnd,true);
      ace.ace_setAttributeOnSelection('customStyles-'+styleId, value);
    },'customStyles', true);

    $(this).val(0);
  });

  var message = {};
  message.type = 'customStyles.styles.stylesForPad';
  message.padId = pad.getPadId();
  console.log("requesting styles", message);
  pad.collabClient.sendMessage(message);

  // Register the top bar
  padeditbar.registerDropdownCommand("customStyles");
  // This is called with padeditbar.toggleDropDown("customStyles")
}

exports.handleClientMessage_CUSTOM = function(hook, context){
  // console.log("context", context);
  // Handles Custom Object Messages
  if(context.data){
    context.data = context.data.payload;
    context.payload.data = context.data.payload;
  }
  // console.log("context.payload.type", context.payload.type);
  // Handles Custom Messages
  if(!context.payload) return;
  var customStyle = (context.payload.type.indexOf("custom_style") === 0);
  if(!customStyle) return;
  // console.log("Got a custom style message from server", context.payload);

  isError = (context.payload.method.indexOf("customStyles.error") === 0);

  if(isError){
    customStyles.error(context);
    return;
  }

  var method = context.payload.method.replace("customStyles.styles.","");
  // Perform the related method for this data
  if(context.payload.method === "customStyles.styles.new"){
    var message = {};
    message.type = 'customStyles.styles.stylesForPad';
    message.padId = pad.getPadId();
    console.log("requesting styles", message);
    pad.collabClient.sendMessage(message);
  }else{
    customStyles.styles[method](context.payload.data);
  }
}

/* Deals mostly with responses from the server */
var customStyles = {
  drawSelect: function(styleIds){
    console.log("Appending styles to UI", styleIds);
    $.each(styleIds, function(k,styleId){
      $('#availableStyles').append('<p> \
        <input type=checkbox id="'+styleId+'"> \
        <label for="'+styleId+'">'+styleId+'</label> \
        -- <span class="editStyle">Edit</span> \
        -- <span class="deleteStyle">Delete</span> \
      </p>');
      // $('#customStyles').append($('<option>', { value : styleId }).text(styleId)); 
    });
  },
  styles: {
    stylesForPad: function(styleIds){
      if(styleIds){
        console.log("Getting CSS of StyleIds", styleIds);
        $.each(styleIds, function(k,styleIds){
          request("customStyles.styles.get", {styleId: styleIds});
	});
        customStyles.drawSelect(styleIds);
      }
    },
    get: function(style){
      drawStyle(style);
    },
    new: function(padId, styleId, css){
      console.log("new", padId, styleId, css)
      // customStyles.drawSelect();
      request('customStyles.styles.new', {
        padId: padId,
        css: css,
        styleId: styleId
      });
    }
  },
  error: function(context){
    console.log(context);
    if(context.payload.method === "customStyles.error.styleAlreadyExists"){
      $('#options-custom-style-status').text("Style Name Already Exists, use a different Style Name");
    }
  }
}

// Requests and Sends information from the socket
var request = function(method, data){
  var message = data;
  message.type = method;
  console.log("requesting data or so sending data", message);
  pad.collabClient.sendMessage(message);
}

var drawStyle = function(style){
  var inner = $('iframe[name="ace_outer"]').contents().find('iframe[name="ace_inner"]');
  style = style.replace(".","-"); // BAD TODO CAKE
  inner.contents().find("head").append("<style>.customStyles"+style+"</style>");
  console.log("appended style", style);	
}

// Our Custom Style attribute will result in a customStyle:styleId class
exports.aceAttribsToClasses = function(hook, context){
  if(context.key.indexOf("customStyles") > -1){
    return [context.key];
  }
}
