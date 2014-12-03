var cookie = require('ep_etherpad-lite/static/js/pad_cookie').padcookie;
var _ = require('ep_etherpad-lite/static/js/underscore');

if(typeof exports == 'undefined'){
  var exports = this['mymodule'] = {};
}

var lintLog = function(value, level){
  $('#options-custom-style-lint').append("<span class=\"lint" + level + "\">" + value.replace(/ /g, "&nbsp;") + "</span><br>");
}

exports.postAceInit = function(hook, context){
  /* Stores data we will use throughout the app */
  if(!pad.plugins) pad.plugins = {};
  pad.plugins.ep_custom_styles = {};
  pad.plugins.ep_custom_styles.styleIds = [];
  pad.plugins.ep_custom_styles.styles = {};

  // Listener events
  $('body').on("click", "#options-custom-style-save", function(){
    var padId = pad.getPadId();
    var styleId = $('#options-custom-style-name').val();
    var css = $('#options-custom-style-css').val();
    if(pad.plugins.ep_custom_styles.isUpdating){
      customStyles.styles.update(padId, styleId, css);
    }else{
      customStyles.styles.new(padId, styleId, css);
    }
    pad.collabClient.sendMessage(message);
    applyCustomStyle(context, styleId, true);
    padeditbar.toggleDropDown("customStyle");
  });

  // Listen for a click of the paintbrush icon to bring up the popup
  $('body').on('click', '.ep_custom_styles', function(){
    padeditbar.toggleDropDown("customStyles");
    reDrawSelectedAttributes(context);
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

  // When the checkbox is checked apply the style
  $('#availableStyles').on('change', 'p > input', function(){
    var styleId = $(this).context.id;
    var value = $(this).context.checked;
    if(!styleId) return;
    applyCustomStyle(context, styleId, value);
    $(this).val(0);
  });

  $('#customStyles').on('click', '#newStyle', function(){
    pad.plugins.ep_custom_styles.isUpdating = false;
    padeditbar.toggleDropDown("newCustomStyle");
  });

  $('#newCustomStyle').on('click', '#options-custom-style-cancel', function(){
    padeditbar.toggleDropDown("newCustomStyle");
  });

  $('#availableStyles').on('click', 'p > .editStyle', function(){
    var styleId = $(this).data("styleid");
    editStyle(styleId);
  });

  $('#availableStyles').on('click', 'p > .deleteStyle', function(){
    var styleId = $(this).data("styleid");
    deleteStyle(styleId);
  });

  var message = {};
  message.type = 'customStyles.styles.stylesForPad';
  message.padId = pad.getPadId();
  console.log("requesting styles", message);
  pad.collabClient.sendMessage(message);

  // Register the top bar and new style dropdown
  padeditbar.registerDropdownCommand("customStyles");
  padeditbar.registerDropdownCommand("newCustomStyle");
  // This is called with padeditbar.toggleDropDown("customStyles") etc.
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
    customStyles.styles[method](context.payload.data, context.payload.request);
  }
}

/* Deals mostly with responses from the server */
var customStyles = {
  data: {
    styles: []
  },
  drawSelect: function(styleIds, requestedData){
    pad.plugins.ep_custom_styles.styleIds = styleIds;
    $('#availableStyles').html("");
    $.each(styleIds, function(k,styleId){
      console.log("pushing", styleId);
      $('#availableStyles').append('<p> \
        <input type=checkbox id="'+styleId+'"> \
        <label for="'+styleId+'">'+styleId+'</label> \
        -- <span data-styleid="'+styleId+'" class="editStyle">Edit</span> \
        -- <span data-styleid="'+styleId+'" class="deleteStyle">Delete</span> \
      </p>');
    });
  },
  styles: {
    stylesForPad: function(styleIds, requestedData){
      if(styleIds){
        console.log("Getting CSS of StyleIds", styleIds);
        $.each(styleIds, function(k,styleId){
          // pad.plugins.ep_custom_styles.styles[styleId] = styleId;
          request("customStyles.styles.get", {styleId: styleId});
	});
        customStyles.drawSelect(styleIds);
      }
    },
    get: function(style, requestedData){
      // So this might seem a bit weird..  And it sort of is..
      // When we reply to the client we tell it the styleId of the style it requested.
      // This is the requestedData object, we might use it for other things so I kept it vague
      var styleId = requestedData[0];
      pad.plugins.ep_custom_styles[styleId] = style;
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
    },
    update: function(padId, styleId, css){
      console.log("update", padId, styleId, css)
      request('customStyles.styles.update', {
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
}

// Our Custom Style attribute will result in a customStyle:styleId class
exports.aceAttribsToClasses = function(hook, context){
  if(context.key.indexOf("customStyles") > -1){
    return [context.key];
  }
}

// Applies a custom Style to a piece of content
var applyCustomStyle = function(context, styleId, value){
  var rep = {};
  context.ace.callWithAce(function (ace){
    var saveRep = ace.ace_getRep();
    rep.selStart = saveRep.selStart;
    rep.selEnd = saveRep.selEnd;
  },'customStyles', true);

  if (rep.selStart[0] == rep.selEnd[0] && rep.selStart[1] == rep.selEnd[1]) {
    // console.log("nothing selected");
    return;
  }

  context.ace.callWithAce(function (ace){
    ace.ace_performSelectionChange(rep.selStart,rep.selEnd,true);
    ace.ace_setAttributeOnSelection('customStyles-'+styleId, value);
  },'customStyles', true);
}

var reDrawSelectedAttributes = function(context){
  context.ace.callWithAce(function (ace){
    var rep = rep = ace.ace_getRep();
    if(rep.selStart[0] == rep.selEnd[0] && rep.selEnd[1] == rep.selStart[1]){
      return; // don't perform if we don't have anything selected
    }
    $.each(pad.plugins.ep_custom_styles.styleIds, function(k,v){
      var attrIsApplied = ace.ace_getAttributeOnSelection("customStyles-"+v);
      if(attrIsApplied){ // attribute is applied to this selection
        $('#'+v).prop("checked", true);
      }else{
        $('#'+v).prop("checked", false);
      }
    });
    // Get Each Available Style
  },'customStyles', true);
};

var editStyle = function(styleId){
  padeditbar.toggleDropDown("newCustomStyle");
  $('#options-custom-style-name').val(styleId);
  $('#options-custom-style-css').val(pad.plugins.ep_custom_styles[styleId]);
  pad.plugins.ep_custom_styles.isUpdating = true;
}

var deleteStyle = function(styleId){
  var confirmed = confirm("Are you sure you want to delete this style?  This will remove the style for every pad on this Etherpad instance");
  if(!confirmed) return;
  request("customStyles.styles.delete", {styleId: styleId});
  console.log("deleting"+ styleId);  
}
