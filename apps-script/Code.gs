function onOpen() {
  SlidesApp.getUi()
    .createAddonMenu()
    .addItem('Open PDF → Slides', 'showSidebar')
    .addToUi();
}

function onInstall(e) {
  onOpen(e);
}

function showSidebar() {
  var html = HtmlService.createHtmlOutputFromFile('ui/index')
    .setTitle('PDF → Slides')
    .setWidth(360);
  SlidesApp.getUi().showSidebar(html);
}

/**
 * Creates slides in the active presentation from a slideSpec array.
 * slideSpec: Array<{ title: string, bullets: string[], imagePngBase64?: string }>
 */
function createSlides(payload) {
  var slidesInput = [];
  var pageImages = null;
  if (Array.isArray(payload)) {
    slidesInput = payload;
  } else if (payload && Array.isArray(payload.slides)) {
    slidesInput = payload.slides;
    if (payload.pageImages && Array.isArray(payload.pageImages)) pageImages = payload.pageImages;
  }
  if (!slidesInput || !slidesInput.length) return 'No slides to create';
  var presentation = SlidesApp.getActivePresentation();
  var pageWidth = presentation.getPageWidth ? presentation.getPageWidth() : 960;
  var pageHeight = presentation.getPageHeight ? presentation.getPageHeight() : 540;
  var margin = 24;
  for (var i = 0; i < slidesInput.length; i++) {
    var spec = slidesInput[i];
    var slide = presentation.appendSlide(SlidesApp.PredefinedLayout.TITLE_AND_BODY);
    var pageElements = slide.getPageElements();
    var titleShape = slide.getPlaceholder(SlidesApp.PlaceholderType.TITLE);
    var bodyShape = slide.getPlaceholder(SlidesApp.PlaceholderType.BODY);
    if (titleShape && spec.title) titleShape.asShape().getText().setText(spec.title);
    if (bodyShape && spec.bullets && spec.bullets.length) {
      var textRange = bodyShape.asShape().getText();
      textRange.clear();
      textRange.setText(spec.bullets.join('\n'));
      bodyShape.asShape().getText().getListStyle().applyListPreset(SlidesApp.ListPreset.DISC_CIRCLE_SQUARE);
    }
    var imageBase64 = null;
    if (pageImages && pageImages[i]) {
      imageBase64 = pageImages[i];
    } else if (spec.imagePngBase64) {
      imageBase64 = spec.imagePngBase64;
    }
    if (imageBase64) {
      if (bodyShape) {
        try {
          var body = bodyShape.asShape();
          body.setLeft(margin);
          body.setWidth(Math.max(200, (pageWidth * 0.5) - (2 * margin)));
        } catch (e) {}
      }

      var blob = Utilities.newBlob(Utilities.base64Decode(imageBase64), 'image/png', 'image.png');
      var image = slide.insertImage(blob);
      var maxImgWidth = Math.max(200, (pageWidth * 0.4) - (2 * margin));
      var maxImgHeight = Math.max(200, (pageHeight * 0.6));
      image.setWidth(maxImgWidth);
      if (image.getHeight() > maxImgHeight) {
        image.setHeight(maxImgHeight);
      }
      var imgW = image.getWidth();
      var imgH = image.getHeight();
      var leftColWidth = (pageWidth * 0.5);
      var imgLeft = Math.min(pageWidth - imgW - margin, Math.max(leftColWidth + margin, (pageWidth * 0.55)));
      var imgTop = Math.max(margin, (pageHeight - imgH) / 2);
      image.setLeft(imgLeft).setTop(imgTop);
    }
  }
  if (pageImages && pageImages.length > slidesInput.length) {
    for (var p = slidesInput.length; p < pageImages.length; p++) {
      var b64 = pageImages[p];
      if (!b64) continue;
      var s = presentation.appendSlide(SlidesApp.PredefinedLayout.BLANK);
      var blob2 = Utilities.newBlob(Utilities.base64Decode(b64), 'image/png', 'page-image.png');
      var img = s.insertImage(blob2);
      var scale = Math.min((pageWidth - 2*margin) / img.getWidth(), (pageHeight - 2*margin) / img.getHeight());
      img.setWidth(img.getWidth() * scale);
      img.setHeight(img.getHeight() * scale);
      img.setLeft((pageWidth - img.getWidth()) / 2).setTop((pageHeight - img.getHeight()) / 2);
    }
  }
  return 'Slides created: ' + slidesInput.length;
}


