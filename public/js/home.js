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

  $('#inputDeadline').datetimepicker({
    icons: {
      time: 'fa fa-clock-o fa-lg',
      date: 'fa fa-calendar fa-lg',
      up: 'fa fa-arrow-up fa-lg',
      down: 'fa fa-arrow-down fa-lg'
    },
    minuteStepping: 5,
    minDate: new Date(),
    maxDate: new Date(new Date().getTime() +
      1000 * 60 * 60 * 24 * 7), // week later
    sideBySide: true
  });

  // Submit Question button click.
  $('#aSubmitQuestion').on('click', home.submitQuestion);
  //- For using "Enter" key.
  $('#btnSubmitQuestion').on('click', home.submitQuestion);

});
