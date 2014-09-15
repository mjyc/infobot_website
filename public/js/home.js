// =====================================================================
// DOM Ready
// =====================================================================

$(document).ready(function() {

  // Make switches pretty.
  $('.js-switch').each(function(index) {
    new Switchery(this);
  });

  // Initialize contents.
  home.init({'cardManager': queryjobCardManager});

  // Infinite scroll setups.
  $(window).scroll(function() {
    var wintop = $(window).scrollTop();
    var docheight = $(document).height();
    var winheight = $(window).height();
    var scrolltrigger = 0.95;

    if ((wintop / (docheight - winheight)) > scrolltrigger) {
      home.loadMore();
    }
  });

  // Submit Question button click.
  $('#aSubmitQuestion').on('click', home.submitQuestion);
  //- For using "Enter" key.
  $('#btnSubmitQuestion').on('click', home.submitQuestion);

});
