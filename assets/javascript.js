// jQuery + Bootstrap 3
$(function () {
  var $container = $('.publication-list'); // wrapper containing h4/ul sections
  var selected = { type: 'all', topic: 'all' };

  function allItems() {
    return $container.find('li.publication');
  }

  function selFor(typeCls, topicCls) {
    var sel = 'li.publication';
    if (typeCls && typeCls !== 'all') sel += '.' + typeCls;
    if (topicCls && topicCls !== 'all') sel += '.' + topicCls;
    return sel; // AND via combined selector
  }

  function countFor(typeCls, topicCls) {
    var sel = selFor(typeCls, topicCls);
    return allItems().filter(sel).length; // count independent of visibility
  }

  function updateBadges() {
    $('#filter-all .badge').text(allItems().length);

    $('#type-group .btn').each(function () {
      var cat = $(this).data('category');
      $(this).find('.badge').text(countFor(cat, selected.topic));
    });

    $('#topic-group .btn').each(function () {
      var cat = $(this).data('category');
      $(this).find('.badge').text(countFor(selected.type, cat));
    });
  }

  function updateYearVisibility(currentSel) {
    $container.find('h4').each(function () {
      var $h4 = $(this);
      var $ul = $h4.next('ul');
      // Count items that WOULD match the current filter (not :visible)
      var matchCount = $ul.find(currentSel).length;
      if (matchCount === 0) {
        $h4.hide();
        $ul.hide();
      } else {
        $h4.show();
        $ul.show();
      }
    });
  }

  function applyFilters() {
    var sel = selFor(selected.type, selected.topic);

    // Always filter against ALL items
    var $all = allItems();
    $all.hide().filter(sel).show();

    updateBadges();
    updateYearVisibility(sel);
  }

  // Type selection
  $('#type-group .btn').on('click', function () {
    $('#type-group .btn').removeClass('active');
    $(this).addClass('active');
    selected.type = $(this).data('category');
    applyFilters();
  });

  // Topic selection
  $('#topic-group .btn').on('click', function () {
    $('#topic-group .btn').removeClass('active');
    $(this).addClass('active');
    selected.topic = $(this).data('category');
    applyFilters();
  });

  // Reset both to All
  $('#filter-all').on('click', function () {
    selected.type = 'all';
    selected.topic = 'all';
    $('#type-group .btn, #topic-group .btn').removeClass('active');
    $('#type-group .btn[data-category="all"], #topic-group .btn[data-category="all"]').addClass('active');
    applyFilters();
  });

  // Init
  updateBadges();
  applyFilters();
});