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
function createSlides(slideSpec) {
  if (!slideSpec || !slideSpec.length) return 'No slides to create';
  var presentation = SlidesApp.getActivePresentation();
  var pageWidth = presentation.getPageWidth ? presentation.getPageWidth() : 960;
  var pageHeight = presentation.getPageHeight ? presentation.getPageHeight() : 540;
  var margin = 24;
  for (var i = 0; i < slideSpec.length; i++) {
    var spec = slideSpec[i];
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
    if (spec.imagePngBase64) {
      if (bodyShape) {
        try {
          var body = bodyShape.asShape();
          body.setLeft(margin);
          body.setWidth(Math.max(200, (pageWidth * 0.5) - (2 * margin)));
        } catch (e) {}
      }

      var blob = Utilities.newBlob(Utilities.base64Decode(spec.imagePngBase64), 'image/png', 'image.png');
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
  return 'Slides created: ' + slideSpec.length;
}


