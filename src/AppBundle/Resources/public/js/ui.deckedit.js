/* global app, _, Translator */

(function ui_deck(ui, $)
{

    var DisplayColumnsTpl = '',
            SortKey = 'type_code',
            SortOrder = 1,
            CardDivs = [[], [], []],
            Config = null;

    /**
     * reads ui configuration from localStorage
     * @memberOf ui
     */
    ui.read_config_from_storage = function read_config_from_storage()
    {
        if(localStorage) {
            var stored = localStorage.getItem('ui.deck.config');
            if(stored) {
                Config = JSON.parse(stored);
            }
        }
        Config = _.extend({
            'show-unusable': false,
            'show-only-deck': false,
            'display-column': 1,
            'buttons-behavior': 'cumulative'
        }, Config || {});
    };

    /**
     * write ui configuration to localStorage
     * @memberOf ui
     */
    ui.write_config_to_storage = function write_config_to_storage()
    {
        if(localStorage) {
            localStorage.setItem('ui.deck.config', JSON.stringify(Config));
        }
    };

    /**
     * inits the state of config buttons
     * @memberOf ui
     */
    ui.init_config_buttons = function init_config_buttons()
    {
        // radio
        // ['display-column', 'core-set', 'buttons-behavior'].forEach(function (radio)
        // {
        //     $('input[name=' + radio + '][value=' + Config[radio] + ']').prop('checked', true);
        // });
        // checkbox
        ['show-unusable', 'show-only-deck'].forEach(function (checkbox)
        {
            if(Config[checkbox])
                $('input[name=' + checkbox + ']').prop('checked', true);
        });
    };

    /**
     * builds the type selector
     * @memberOf ui
     */
    ui.build_type_selector = function build_type_selector()
    {
        $('[data-filter=type_code]').empty();
        ['location', 'character', 'starship', 'vehicle', 'weapon', 'device', 'effect', 'interrupt', 'admirals-order'].forEach(function (type_code)
        {
            var example = app.data.cards.find({"type_code": type_code})[0];
            var icon = 'icon-' + type_code;
            if (type_code == 'location' || type_code == 'character') {
              icon += '-'+app.deck.get_side_code();
            }
            var label = $('<label class="btn btn-default btn-sm" data-code="'
                    + type_code + '" title="' + example.type_name + '"><input type="checkbox" name="' + type_code
                    + '"><span class="icon ' + icon + '"></span></label>');
            label.tooltip({container: 'body'});
            $('[data-filter=type_code]').append(label);
        });
        $('[data-filter=type_code]').button();
    };

    /**
     * builds the set selector
     * @memberOf ui
     */
    ui.build_set_selector = function build_set_selector()
    {
        $('[data-filter=set_code]').empty();
        app.data.sets.find({
            name: {
                '$exists': true
            }
        }, {
            $orderBy: {
                cycle_position: 1,
                position: 1
            }
        }).forEach(function (record)
        {
            // checked or unchecked ? checked by default
            var checked = true;
            // if user checked it previously, check set
            if(localStorage && localStorage.getItem('set_code_' + record.code) !== null)
                checked = true;
            // if set used by cards in deck, check set
            var cards = app.data.cards.find({
                set_code: record.code,
                indeck: {
                    '$gt': 0
                }
            });
            if(cards.length)
                checked = true;

            $('<li><a href="#"><label><input type="checkbox" name="' + record.code + '"' + (checked ? ' checked="checked"' : '') + '>' + record.name + '</label></a></li>').appendTo('[data-filter=set_code]');
        });
    };

    /**
     * @memberOf ui
     */
    ui.init_selectors = function init_selectors()
    {
        $('[data-filter=type_code]').find('input[name=location]').prop("checked", true).parent().addClass('active');
    };

    function uncheck_all_others()
    {
        $(this).closest('[data-filter]').find("input[type=checkbox]").prop("checked", false);
        $(this).children('input[type=checkbox]').prop("checked", true).trigger('change');
    }

    function check_all_others()
    {
        $(this).closest('[data-filter]').find("input[type=checkbox]").prop("checked", true);
        $(this).children('input[type=checkbox]').prop("checked", false);
    }

    function uncheck_all_active()
    {
        $(this).closest('[data-filter]').find("label.active").button('toggle');
    }

    function check_all_inactive()
    {
        $(this).closest('[data-filter]').find("label:not(.active)").button('toggle');
    }

    /**
     * @memberOf ui
     * @param event
     */
    ui.on_click_filter = function on_click_filter(event)
    {
        var dropdown = $(this).closest('ul').hasClass('dropdown-menu');
        if(dropdown) {
            if(event.shiftKey) {
                if(!event.altKey) {
                    uncheck_all_others.call(this);
                } else {
                    check_all_others.call(this);
                }
            }
            event.stopPropagation();
        } else {
            if(!event.shiftKey && Config['buttons-behavior'] === 'exclusive' || event.shiftKey && Config['buttons-behavior'] === 'cumulative') {
                if(!event.altKey) {
                    uncheck_all_active.call(this);
                } else {
                    check_all_inactive.call(this);
                }
            }
        }
    };

    /**
     * @memberOf ui
     * @param event
     */
    ui.on_input_smartfilter = function on_input_smartfilter(event)
    {
        var q = $(this).val();
        if(q.match(/^\w[:<>!]/))
            app.smart_filter.update(q);
        else
            app.smart_filter.update('');
        ui.refresh_list();
    };

    /**
     * @memberOf ui
     * @param event
     */
    ui.on_submit_form = function on_submit_form(event)
    {
        var deck_json = app.deck.get_json();
        $('input[name=content]').val(deck_json);
        $('input[name=description]').val($('textarea[name=description_]').val());
        $('input[name=tags]').val($('input[name=tags_]').val());
    };

    /**
     * @memberOf ui
     * @param event
     */
    ui.on_config_change = function on_config_change(event)
    {
        var name = $(this).attr('name');
        var type = $(this).prop('type');
        switch(type) {
            case 'radio':
                var value = $(this).val();
                if(!isNaN(parseInt(value, 10)))
                    value = parseInt(value, 10);
                Config[name] = value;
                break;
            case 'checkbox':
                Config[name] = $(this).prop('checked');
                break;
        }
        ui.write_config_to_storage();
        switch(name) {
            case 'buttons-behavior':
                break;
            case 'display-column':
                ui.update_list_template();
                ui.refresh_list();
                break;
            default:
                ui.refresh_list();
        }
    };

    /**
     * @memberOf ui
     * @param event
     */
    ui.on_table_sort_click = function on_table_sort_click(event)
    {
        event.preventDefault();
        var new_sort = $(this).data('sort');
        if(SortKey === new_sort) {
            SortOrder *= -1;
        } else {
            SortKey = new_sort;
            SortOrder = 1;
        }
        ui.refresh_list();
        ui.update_sort_caret();
    };

    /**
     * @memberOf ui
     * @param event
     */
    ui.on_list_quantity_change = function on_list_quantity_change(event)
    {
        var row = $(this).closest('.card-container');
        var code = row.data('code');
        var command = $(this).data('command');
        ui.on_quantity_change(code, command);
    };

    /**
     * @memberOf ui
     * @param event
     */
    ui.on_modal_quantity_change = function on_modal_quantity_change(event)
    {
        var modal = $('#cardModal');
        var card_code = modal.data('code');
        var command = $(this).data('command');
        ui.on_quantity_change(card_code, command);

        setTimeout(function ()
        {
            $('#filter-text').typeahead('val', '').focus();
        }, 100);
    };

    ui.refresh_row = function refresh_row(card_code, quantity)
    {
        // for each set of divs (1, 2, 3 columns)
        CardDivs.forEach(function (rows)
        {
            var row = rows[card_code];
            if(!row)
                return;

            if(quantity > 0) {
              $(row).addClass('indeck');
            } else {
              $(row).removeClass('indeck');
            }

        });
    };

    /**
     * @memberOf ui
     */
    ui.on_quantity_change = function on_quantity_change(card_code, command)
    {
        var quantity = app.deck.get_nb_cards(app.deck.get_cards(null, {code: card_code}));
        if (command == '+') {
          quantity++;
        }
        if (quantity > 0 && command == '-') {
          quantity--;
        }
        var update_all = app.deck.set_card_copies(card_code, quantity);
        ui.refresh_deck();

        if(update_all) {
            ui.refresh_list();
        } else {
            ui.refresh_row(card_code, quantity);
        }
    };

    /**
     * sets up event handlers ; dataloaded not fired yet
     * @memberOf ui
     */
    ui.setup_event_handlers = function setup_event_handlers()
    {

        $('[data-filter]').on({
            change: ui.refresh_list,
            click: ui.on_click_filter
        }, 'label');

        $('#filter-text').on('input', ui.on_input_smartfilter);

        $('#save_form').on('submit', ui.on_submit_form);

        $('#btn-save-as-copy').on('click', function (event)
        {
            $('#deck-save-as-copy').val(1);
        });

        $('#btn-cancel-edits').on('click', function (event)
        {
            var unsaved_edits = app.deck_history.get_unsaved_edits();
            if(unsaved_edits.length) {
                var confirmation = confirm("This operation will revert the changes made to the deck since " + unsaved_edits[0].date_creation.calendar() + ". The last " + (unsaved_edits.length > 1 ? unsaved_edits.length + " edits" : "edit") + " will be lost. Do you confirm?");
                if(!confirmation)
                    return false;
            } else {
                if(app.deck_history.is_changed_since_last_autosave()) {
                    var confirmation = confirm("This operation will revert the changes made to the deck. Do you confirm?");
                    if(!confirmation)
                        return false;
                }
            }
            $('#deck-cancel-edits').val(1);
        });

        $('#config-options').on('change', 'input', ui.on_config_change);
        $('#collection').on('click', 'button[type=button]', ui.on_list_quantity_change);

        // $('#cardModal').on('keypress', function (event)
        // {
        //     var num = parseInt(event.which, 10) - 48;
        //     $('#cardModal input[type=radio][value=' + num + ']').trigger('change');
        // });
        $('#cardModal .modal-qty').on('click', 'button[type=button]', ui.on_modal_quantity_change);

        $('thead').on('click', 'a[data-sort]', ui.on_table_sort_click);

    };

    /**
     * returns the current card filters as an array
     * @memberOf ui
     */
    ui.get_filters = function get_filters()
    {
        var filters = {};
        $('[data-filter]').each(
                function (index, div)
                {
                    var column_name = $(div).data('filter');
                    var arr = [];
                    $(div).find("input[type=checkbox]").each(
                            function (index, elt)
                            {
                                if($(elt).prop('checked'))
                                    arr.push($(elt).attr('name'));
                            }
                    );
                    if(arr.length) {
                        filters[column_name] = {
                            '$in': arr
                        };
                    }
                }
        );
        return filters;
    };

    /**
     * updates internal variables when display columns change
     * @memberOf ui
     */
    ui.update_list_template = function update_list_template()
    {
        switch(Config['display-column']) {
            case 1:
                DisplayColumnsTpl = _.template(
                        '<tr>'
                        + '<td class="actions"><div class="btn-group"><button type="button" class="btn btn-default btn-sm btn-card-remove" data-command="-" title="Remove from deck"><span class="fa fa-minus"></span></button><button type="button" class="btn btn-default btn-sm btn-card-add" data-command="+" title="Add to deck"><span class="fa fa-plus"></span></button></div></td>'
                        + '<td><a class="card card-tip" data-code="<%= card.code %>" href="<%= url %>" data-target="#cardModal" data-remote="false" data-toggle="modal"><%= card.label %></a></td>'
                        + '<td class="type"><%= card.type_name %></td>'
                        + '</tr>'
                        );
                break;
            case 2:
                DisplayColumnsTpl = _.template(
                        '<div class="col-sm-6">'
                        + '<div class="media">'
                        + '<div class="media-left"><img class="media-object" src="<%= card.image_url %>" alt="<%= card.name %>"></div>'
                        + '<div class="media-body">'
                        + '<h4 class="media-heading"><a class="card card-tip" data-code="<%= card.code %>" href="<%= url %>" data-target="#cardModal" data-remote="false" data-toggle="modal"><%= card.name %></a></h4>'
                        + '<div class="btn-group"><button type="button" class="btn btn-default btn-sm btn-card-remove" data-command="-" title="Remove from deck"><span class="fa fa-minus"></span></button><button type="button" class="btn btn-default btn-sm btn-card-add" data-command="+" title="Add to deck"><span class="fa fa-plus"></span></button></div>'
                        + '</div>'
                        + '</div>'
                        + '</div>'
                        );
                break;
            case 3:
                DisplayColumnsTpl = _.template(
                        '<div class="col-sm-4">'
                        + '<div class="media">'
                        + '<div class="media-left"><img class="media-object" src="<%= card.image_url %>" alt="<%= card.name %>"></div>'
                        + '<div class="media-body">'
                        + '<h5 class="media-heading"><a class="card card-tip" data-code="<%= card.code %>" href="<%= url %>" data-target="#cardModal" data-remote="false" data-toggle="modal"><%= card.name %></a></h5>'
                        + '<div class="btn-group"><button type="button" class="btn btn-default btn-sm btn-card-remove" data-command="-" title="Remove from deck"><span class="fa fa-minus"></span></button><button type="button" class="btn btn-default btn-sm btn-card-add" data-command="+" title="Add to deck"><span class="fa fa-plus"></span></button></div>'
                        + '</div>'
                        + '</div>'
                        + '</div>'
                        );
        }
    };

    /**
     * builds a row for the list of available cards
     * @memberOf ui
     */
    ui.build_row = function build_row(card)
    {
        // var radios = '', radioTpl = _.template(
        //         '<label class="btn btn-xs btn-default <%= active %>"><input type="radio" name="qty-<%= card.code %>" value="<%= i %>"><%= i %></label>'
        //         );
        //
        // for(var i = 0; i <= card.maxqty; i++) {
        //     radios += radioTpl({
        //         i: i,
        //         active: (i === card.indeck ? ' active' : ''),
        //         card: card
        //     });
        // }

        var html = DisplayColumnsTpl({
            url: Routing.generate('cards_zoom', {card_code: card.code}),
            card: card
        });
        return $(html);
    };

    ui.reset_list = function reset_list()
    {
        CardDivs = [[], [], []];
        ui.refresh_list();
    };

    /**
     * destroys and rebuilds the list of available cards
     * don't fire unless 250ms has passed since last invocation
     * @memberOf ui
     */
    ui.refresh_list = _.debounce(function refresh_list()
    {
        $('#collection-table').empty();
        $('#collection-grid').empty();

        var counter = 0,
                container = $('#collection-table'),
                filters = ui.get_filters(),
                query = app.smart_filter.get_query(filters),
                orderBy = {};

        SortKey.split('|').forEach(function (key)
        {
            orderBy[key] = SortOrder;
        });
        if(SortKey !== 'name')
            orderBy['name'] = 1;
        var cards = app.data.cards.find(query, {'$orderBy': orderBy});
        var divs = CardDivs[ Config['display-column'] - 1 ];

        cards.forEach(function (card)
        {
            if(Config['show-only-deck'] && !card.indeck)
                return;
            var unusable = !app.deck.can_include_card(card);
            if(!Config['show-unusable'] && unusable)
                return;

            var row = divs[card.code];
            if(!row)
                row = divs[card.code] = ui.build_row(card);

            row.data("code", card.code).addClass('card-container');

            if(card.indeck) {
              row.data("code", card.code).addClass('indeck');
            }

            if(Config['display-column'] > 1 && (counter % Config['display-column'] === 0)) {
                container = $('<div class="row"></div>').appendTo($('#collection-grid'));
            }

            container.append(row);
            counter++;
        });
    }, 250);

    /**
     * called when the deck is modified and we don't know what has changed
     * @memberOf ui
     */
    ui.on_deck_modified = function on_deck_modified()
    {
        ui.refresh_deck();
        ui.refresh_list();
    };


    /**
     * @memberOf ui
     */
    ui.refresh_deck = function refresh_deck()
    {
        app.deck.display('#deck');
        app.draw_simulator && app.draw_simulator.reset();
        app.deck_charts && app.deck_charts.setup();
    };

    /**
     * @memberOf ui
     */
    ui.setup_typeahead = function setup_typeahead()
    {

        function findMatches(q, cb)
        {
            if(q.match(/^\w:/))
                return;
            var regexp = new RegExp(q, 'i');
            cb(app.data.cards.find({name: regexp}));
        }

        $('#filter-text').typeahead({
            hint: true,
            highlight: true,
            minLength: 2
        }, {
            name: 'cardnames',
            displayKey: 'label',
            source: findMatches
        });

    };

    ui.update_sort_caret = function update_sort_caret()
    {
        var elt = $('[data-sort="' + SortKey + '"]');
        $(elt).closest('tr').find('th').removeClass('dropup').find('span.caret').remove();
        $(elt).after('<span class="caret"></span>').closest('th').addClass(SortOrder > 0 ? '' : 'dropup');
    };

    /**
     * called when the DOM is loaded
     * @memberOf ui
     */
    ui.on_dom_loaded = function on_dom_loaded()
    {
        ui.init_config_buttons();
        ui.update_sort_caret();
        ui.setup_event_handlers();
        app.textcomplete && app.textcomplete.setup('#description');
        app.markdown && app.markdown.setup('#description', '#description-preview');
        app.draw_simulator && app.draw_simulator.on_dom_loaded();
        app.card_modal && $('#filter-text').on('typeahead:selected typeahead:autocompleted', app.card_modal.typeahead);
    };

    /**
     * called when the app data is loaded
     * @memberOf ui
     */
    ui.on_data_loaded = function on_data_loaded()
    {
        app.draw_simulator && app.draw_simulator.on_data_loaded();
    };

    /**
     * called when both the DOM and the data app have finished loading
     * @memberOf ui
     */
    ui.on_all_loaded = function on_all_loaded()
    {
        ui.update_list_template();
        ui.build_type_selector();
        ui.build_set_selector();
        ui.init_selectors();
        ui.refresh_deck();
        ui.refresh_list();
        ui.setup_typeahead();
        app.deck_history && app.deck_history.setup('#history');
    };

    ui.read_config_from_storage();

})(app.ui, jQuery);
