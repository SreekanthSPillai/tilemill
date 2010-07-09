TileMill.controller.project = function() {
  var id = $.bbq.getState("id");
  TileMill.backend.get('project/' + id + '/' + id + '.mml', function(mml) {

    // Store current settings. @TODO: Refactor this.
    TileMill.settings.mml = mml;
    TileMill.settings.id = id;
    TileMill.settings.type = 'project';
    TileMill.settings.filename = 'project/' + id + '/' + id + '.mml';

    // Set the unique query string.
    TileMill.uniq = (new Date().getTime());

    TileMill.show(TileMill.template('project', {id: id}));

    for (var i in TileMill.editor) {
      TileMill.editor[i]();
    }

    var layers = TileMill.mml.init();
    var stylesheets = TileMill.stylesheet.init();
    var map = TileMill.map.init();
    var color = TileMill.colors.init();

    $('#sidebar').append(layers);
    $('body').append(map);
    $('body').append(stylesheets);
    $('body').append(color);

    // Farbtastic needs to be inited after the element is added to the DOM.
    TileMill.colors.initFarb(color);
    TileMill.map.initOL(map, TileMill.backend.servers(TileMill.mml.url()), {navigation: 1, fullscreen: 1, zoom: 1, panzoombar: 0});

    $('div#header a.save').click(function() {
      TileMill.project.save();
      return false;
    });

    $('div#header a.info').click(function() {
      var tilelive_url = TileMill.backend.servers(TileMill.mml.url())[0] + 'tile/' + TileMill.mml.url({ timestamp: false, encode: true });
      var mml_url = TileMill.mml.url({ timestamp: false, encode: false });
      var popup = $(TileMill.template('popup-info', {tilelive_url: tilelive_url, mml_url: mml_url}));
      TileMill.popup.show({content: popup, title: 'Info'});
      return false;
    });

    $('a.inspector-close').click(function() {
      $('#layers').show();
      $('#inspector').hide();
      return false;
    });
  });
};

TileMill.project = {};

TileMill.project.save = function() {
  // Refresh storage of active stylesheet before saving.
  TileMill.stylesheet.setCode($('#tabs a.active'), true);

  var id = $.bbq.getState("id"), queue = new TileMill.queue();
  queue.add(function(id, next) {
    // Save MML and MSS files.
    var mml = { stylesheets: [], layers: [] };
    $('#tabs a.tab').each(function() {
      mml.stylesheets.push(TileMill.backend.url($.url.setUrl($(this).data('tilemill')['src']).param('filename')) + '&amp;c=' + TileMill.uniq);
      TileMill.stylesheet.save($.url.setUrl($(this).data('tilemill')['src']).param('filename'), $('input', this).val());
    });
    $('#layers ul.sidebar-content li').reverse().each(function() {
      var layer = $(this).data('tilemill');
      layer.file = $('<span/>').text(layer.dataSource).html();
      layer.status = !!$(this).find('input[type=checkbox]').is(':checked');
      mml.layers.push(layer);
    });
    mml = TileMill.mml.generate(mml);
    TileMill.backend.post('project/' + id + '/' + id + '.mml', mml, next);
  }, [id]);
  queue.add(function() {
    TileMill.inspector.load();
    TileMill.uniq = (new Date().getTime());
    TileMill.map.reload($('#map-preview'), TileMill.backend.servers(TileMill.mml.url()));
  });
  queue.execute();
}
