var cookie = require('ep_etherpad-lite/static/js/pad_cookie').padcookie;
var _ = require('ep_etherpad-lite/static/js/underscore');
var optionsAlreadyRecovered = false;

if(typeof exports == 'undefined'){
  var exports = this['mymodule'] = {};
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

  $('body').on('change', '#customStyles', function(){
    var value = $(this).val();
    if(!value) return;

    context.ace.callWithAce(function(ace){
      ace.ace_doInsertCustomStyles(value);
    },'customStyles' , true);

    $(this).val(0);
  });

  var message = {};
  message.type = 'customStyles.styles.stylesForPad';
  message.padId = pad.getPadId();
  console.log("requesting styles", message);
  pad.collabClient.sendMessage(message);
}

exports.handleClientMessage_CUSTOM = function(hook, context){
  if(!context.payload) return;
  if(context.payload.type !== "custom_style") return;
  console.log("Got a custom style message from server", context.payload);
  var method = context.payload.method.replace("customStyles.styles.","");
  // Perform the related method for this data
  customStyles.styles[method](context.payload.data);
}

/* Deals mostly with responses from the server */
var customStyles = {
  drawSelect: function(styleIds){
    if($('#customStyles').length !== 0) return; // Don't append if already visible
    // console.log("Drawing select box for Styles", styleIds);
    $('.menu_left').append("<li><select id='customStyles'><option value=0>Custom Value</option></select></li>");
    $.each(styleIds, function(k,styleId){
      $('#customStyles').append($('<option>', { value : styleId }).text(styleId)); 
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
      // customStyles.drawSelect();
      request('customStyles.styles.new', {
        padId: padId,
        css: css,
        styleId: styleId
      });
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
  inner.contents().find("head").append("<style>"+style+"</style>");
  // console.log("appended style", style);	
}

// Find out which lines are selected and assign them the CustomStyles attribute.
// Passing a level >= 0 will set a CustomStyles on the selected lines, level === 0 
// will remove it
function doInsertCustomStyles(styleId){
  var rep = this.rep;
  var documentAttributeManager = this.documentAttributeManager;

  if (!(rep.selStart && rep.selEnd)){
    return;
  }
  
  var firstLine, lastLine;
  
  firstLine = rep.selStart[0];
  lastLine = Math.max(firstLine, rep.selEnd[0] - ((rep.selEnd[1] === 0) ? 1 : 0));
  _(_.range(firstLine, lastLine + 1)).each(function(i){
    if(styleId !== 0){
      documentAttributeManager.setAttributeOnLine(i, 'customStyle', styleId);
    }else{
      documentAttributeManager.removeAttributeOnLine(i, 'customStyle');
    }
  });
}

// Once ace is initialized, we set ace_doInsertCustomStyles and bind it to the context
exports.aceInitialized = function(hook, context){
  var editorInfo = context.editorInfo;
  editorInfo.ace_doInsertCustomStyles = _(doInsertCustomStyles).bind(context);
}

// Here we convert the class align:h1 into a tag
exports.aceDomLinePreProcessLineAttributes = function(name, context){
  var cls = context.cls;
  var domline = context.domline;
  var customStyleType = /(?:^| )customStyle:([A-Za-z0-9]*)/.exec(cls);
  // customStyleType = customStyleType[0].replace(":","-");
  var modifier = {
    preHtml: '<div class="'+customStyleType[1]+'">',
    postHtml: '</div>',
    processedMarker: true
  };
  return [modifier];
};

// Our Custom Style attribute will result in a customStyle:styleId class
exports.aceAttribsToClasses = function(hook, context){
  if(context.key == 'customStyle'){
    return ['customStyle:' + context.value ];
  }
}
