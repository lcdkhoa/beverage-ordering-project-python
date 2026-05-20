$(document).ready(function () {

  function setNewsBannerHeight() {
    const header = $(".main-header");
    const headerHeight = header.length > 0 ? header.outerHeight() : 80;
    const viewportHeight = window.innerHeight;
    const bannerHeight = viewportHeight - headerHeight;

    $("#news-banner-section").css("height", bannerHeight + "px");
  }


  setNewsBannerHeight();


  $(window).on("resize", handleResize(setNewsBannerHeight, 250));
});
