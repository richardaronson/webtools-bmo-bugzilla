/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 * This Source Code Form is "Incompatible With Secondary Licenses", as
 * defined by the Mozilla Public License, v. 2.0. */

$(function() {
    'use strict';

    // all keywords for autocompletion (lazy-loaded on edit)
    var keywords = [];

    // products with descriptions (also lazy-loaded)
    var products = [];

    // scroll to an element
    function scroll_to(el, complete) {
        var offset = el.offset();
        $('html, body')
            .animate({
                    scrollTop: offset.top - 20,
                    scrollLeft: offset.left = 20
                },
                200,
                complete
            );
    }

    // expand/collapse module
    function slide_module(module, action) {
        var latch = module.find('.module-latch');
        var spinner = $(latch.children('.module-spinner')[0]);
        var content = $(module.children('.module-content')[0]);

        function slide_done() {
            spinner.html(content.is(':visible') ? '&#9662;' : '&#9656;');
        }
        if (action == 'show') {
            content.slideDown(200, 'swing', slide_done);
        }
        else if (action == 'hide') {
            content.slideUp(200, 'swing', slide_done);
        }
        else {
            content.slideToggle(200, 'swing', slide_done);
        }
    }

    // expand all modules
    $('#expand-all-btn')
        .click(function(event) {
            event.preventDefault();
            var btn = $(event.target);
            var modules;
            if (btn.data('expanded-modules')) {
                modules = btn.data('expanded-modules');
                btn.data('expanded-modules', false);
                modules.each(function() {
                    slide_module($(this).parent('.module'));
                });
                btn.text('Expand All');
            }
            else {
                modules = $('.module-content:hidden');
                btn.data('expanded-modules', modules);
                modules.each(function() {
                    slide_module($(this).parent('.module'));
                });
                btn.text('Collapse');
            }
        });

    // expand/colapse module
    $('.module-header')
        .click(function(event) {
            event.preventDefault();
            slide_module($(this).parents('.module'));
        });

    // toggle obsolete attachments
    $('#attachments-obsolete-btn')
        .click(function(event) {
            event.preventDefault();
            $(event.target).text(($('#attachments tr:hidden').length ? 'Hide' : 'Show') + ' Obsolete Attachments');
            $('#attachments tr.attach-obsolete').toggle();
        });

    // comment collapse/expand
    $('.comment-spinner')
        .click(function(event) {
            event.preventDefault();
            var spinner = $(event.target);
            var id = spinner.attr('id').match(/\d+$/)[0];
            // switch to full header for initially collapsed comments
            if (spinner.attr('id').match(/^ccs-/)) {
                $('#cc-' + id).hide();
                $('#ch-' + id).show();
            }
            $('#ct-' + id).slideToggle('fast', function() {
                $('#c' + id).find('.activity').toggle();
                spinner.text($('#ct-' + id + ':visible').length ? '-' : '+');
            });
        });

    // url --> unsafe warning
    $('.unsafe-url')
        .click(function(event) {
            event.preventDefault();
            if (confirm('This is considered an unsafe URL and could possibly be harmful. ' +
                        'The full URL is:\n\n' + $(event.target).attr('title') + '\n\nContinue?'))
            {
                try {
                    window.open($(event.target).attr('title'));
                } catch(ex) {
                    alert('Malformed URL');
                }
            }
        });

    // last comment btn
    $('#last-comment-btn')
        .click(function(event) {
            event.preventDefault();
            var id = $('.comment:last')[0].parentNode.id;
            scroll_to($('#' + id));
            window.location.hash = id;
        });

    // top btn
    $('#top-btn')
        .click(function(event) {
            event.preventDefault();
            scroll_to($('body'));
        });

    // use non-native tooltips for relative times and bug summaries
    $('.rel-time, .rel-time-title, .bz_bug_link, .tt').tooltip({
        position: { my: "left top+8", at: "left bottom", collision: "flipfit" },
        show: { effect: 'none' },
        hide: { effect: 'none' }
    });

    // tooltips create a new ui-helper-hidden-accessible div each time a
    // tooltip is shown.  this is never removed leading to memory leak and
    // bloated dom.  http://bugs.jqueryui.com/ticket/10689
    $('.ui-helper-hidden-accessible').remove();

    // product/component info
    $('.spin-toggle, #product-latch, #component-latch')
        .click(function(event) {
            event.preventDefault();
            var latch = $($(event.target).data('latch'));
            var el_for = $($(event.target).data('for'));

            if (latch.data('expanded')) {
                latch.data('expanded', false).html('&#9656;');
                el_for.hide();
            }
            else {
                latch.data('expanded', true).html('&#9662;');
                el_for.show();
            }
        });

    // cc list
    $('#cc-latch, #cc-summary')
        .click(function(event) {
            event.preventDefault();
            var latch = $('#cc-latch');

            if (latch.data('expanded')) {
                latch.data('expanded', false).html('&#9656;');
                $('#cc-list').hide();
            }
            else {
                latch.data('expanded', true).html('&#9662;');
                $('#cc-list').show();
                if (!latch.data('fetched')) {
                    $('#cc-list').html(
                        '<img src="extensions/BugModal/web/throbber.gif" width="16" height="11"> Loading...'
                    );
                    bugzilla_ajax(
                        {
                            url: 'rest/bug_modal/cc/' + BUGZILLA.bug_id
                        },
                        function(data) {
                            $('#cc-list').html(data.html);
                            latch.data('fetched', true);
                        }
                    );
                }
            }
        });

    // copy summary to clipboard
    if ($('#copy-summary').length) {
        var zero = new ZeroClipboard($('#copy-summary'));
        zero.on({
            'error': function(event) {
                console.log(event.message);
                zero.destroy();
                $('#copy-summary').hide();

            },
            'copy': function(event) {
                var clipboard = event.clipboardData;
                clipboard.setData('text/plain', 'Bug ' + BUGZILLA.bug_id + ' - ' + $('#field-value-short_desc').text());
            }
        });
    }

    // lightboxes
    $('.lightbox, .comment-text .lightbox + span:first-of-type a:first-of-type')
        .click(function(event) {
            if (event.metaKey)
                return;
            event.preventDefault();
            lb_show(this);
        });

    // when copying the bug id and summary, reformat to remove \n and alias
    $(document).on(
        'copy', function(event) {
            var selection = document.getSelection().toString().trim();
            var match = selection.match(/^(Bug \d+)\s*\n(.+)$/) ||
                selection.match(/^(Bug \d+)\s+\([^\)]+\)\s*\n(.+)$/);
            if (match) {
                var content = match[1] + ' - ' + match[2].trim();
                if (event.originalEvent.clipboardData) {
                    event.originalEvent.clipboardData.setData('text/plain', content);
                }
                else if (window.clipboardData) {
                    window.clipboardData.setData('Text', content);
                }
                else {
                    return;
                }
                event.preventDefault();
            }
        });

    //
    // anything after this point is only executed for logged in users
    //

    if (BUGZILLA.user.id === 0) return;

    // dirty field tracking
    $('#changeform select').each(function() {
        var that = $(this);
        var dirty = $('#' + that.attr('id') + '-dirty');
        if (!dirty) return;
        var isMultiple = that.attr('multiple');

        // store the option that had the selected attribute when we
        // initially loaded
        var value = that.find('option[selected]').map(function() { return this.value; }).toArray();
        if (value.length === 0 && !that.attr('multiple'))
            value = that.find('option:first').map(function() { return this.value; }).toArray();
        that.data('preselected', value);

        // if the user hasn't touched a field, override the browser's choice
        // with bugzilla's
        if (!dirty.val())
            that.val(value);
    });

    // edit/save mode button
    $('#mode-btn')
        .click(function(event) {
            event.preventDefault();

            // hide buttons, old error messages
            $('#mode-btn-readonly').hide();

            // toggle visibility
            $('.edit-hide').hide();
            $('.edit-show').show();

            // expand specific modules
            $('#module-details .module-header').each(function() {
                if ($(this.parentNode).find('.module-content:visible').length === 0) {
                    $(this).click();
                }
            });

            // if there's no current user-story, it's a better experience if it's editable by default
            if ($('#cf_user_story').val() === '') {
                $('#user-story-edit-btn').click();
            }

            // "loading.." ui
            $('#mode-btn-loading').show();
            $('#cancel-btn').prop('disabled', true);
            $('#mode-btn').prop('disabled', true);

            // load the missing select data
            bugzilla_ajax(
                {
                    url: 'rest/bug_modal/edit/' + BUGZILLA.bug_id
                },
                function(data) {
                    $('#mode-btn').hide();

                    // populate select menus
                    $.each(data.options, function(key, value) {
                        var el = $('#' + key);
                        if (!el) return;
                        var selected = el.val();
                        el.empty();
                        $(value).each(function(i, v) {
                            el.append($('<option>', { value: v.name, text: v.name }));
                        });
                        el.val(selected);
                        if (el.attr('multiple') && value.length < 5) {
                            el.attr('size', value.length);
                        }
                    });

                    // build our product description hash
                    $.each(data.options.product, function() {
                        products[this.name] = this.description;
                    });

                    // keywords is a multi-value autocomplete
                    // (this should probably be a simple jquery plugin)
                    keywords = data.keywords;
                    $('#keywords')
                        .bind('keydown', function(event) {
                            if (event.keyCode == $.ui.keyCode.TAB && $(this).autocomplete('instance').menu.active)
                            {
                                event.preventDefault();
                            }
                        })
                        .blur(function() {
                            $(this).val($(this).val().replace(/,\s*$/, ''));
                        })
                        .autocomplete({
                            source: function(request, response) {
                                response($.ui.autocomplete.filter(keywords, request.term.split(/,\s*/).pop()));
                            },
                            focus: function() {
                                return false;
                            },
                            select: function(event, ui) {
                                var terms = this.value.split(/,\s*/);
                                terms.pop();
                                terms.push(ui.item.value);
                                terms.push('');
                                this.value = terms.join(', ');
                                return false;
                            }
                        });

                    $('#cancel-btn').prop('disabled', false);
                    $('#top-save-btn').show();
                    $('#cancel-btn').show();
                    $('#commit-btn').show();
                },
                function() {
                    $('#mode-btn-readonly').show();
                    $('#mode-btn-loading').hide();
                    $('#mode-btn').prop('disabled', false);
                    $('#mode-btn').show();
                    $('#cancel-btn').hide();
                    $('#commit-btn').hide();

                    $('.edit-show').hide();
                    $('.edit-hide').show();
                }
            );
        });
    $('#mode-btn').prop('disabled', false);

    // disable the save buttons while posting
    $('.save-btn')
        .click(function(event) {
            event.preventDefault();
            if (document.changeform.checkValidity && !document.changeform.checkValidity())
                return;
            $('.save-btn').attr('disabled', true);
            this.form.submit();
        })
        .attr('disabled', false);

    // cc toggle (follow/stop following)
    $('#cc-btn')
        .click(function(event) {
            event.preventDefault();
            var is_cced = $(event.target).data('is-cced') == '1';

            var cc_change;
            if (is_cced) {
                cc_change = { remove: [ BUGZILLA.user.login ] };
                $('#cc-btn')
                    .text('Follow')
                    .data('is-cced', '0')
                    .prop('disabled', true);
            }
            else {
                cc_change = { add: [ BUGZILLA.user.login ] };
                $('#cc-btn')
                    .text('Stop Following')
                    .data('is-cced', '1')
                    .prop('disabled', true);
            }

            bugzilla_ajax(
                {
                    url: 'rest/bug/' + BUGZILLA.bug_id,
                    type: 'PUT',
                    data: JSON.stringify({ cc: cc_change })
                },
                function(data) {
                    $('#cc-btn').prop('disabled', false);
                    if (!(data.bugs[0].changes && data.bugs[0].changes.cc))
                        return;
                    if (data.bugs[0].changes.cc.added == BUGZILLA.user.login) {
                        $('#cc-btn')
                            .text('Stop Following')
                            .data('is-cced', '1');
                    }
                    else if (data.bugs[0].changes.cc.removed == BUGZILLA.user.login) {
                        $('#cc-btn')
                            .text('Follow')
                            .data('is-cced', '0');
                    }
                },
                function(message) {
                    $('#cc-btn').prop('disabled', false);
                }
            );

        });

    // cancel button, reset the ui back to read-only state
    // for now, do this with a redirect to self
    // ideally this should revert all field back to their initially loaded
    // values and switch the ui back to read-only mode without the redirect
    $('#cancel-btn')
        .click(function(event) {
            event.preventDefault();
            window.location.replace($('#this-bug').val());
        });

    // top comment button, scroll the textarea into view
    $('.comment-btn')
        .click(function(event) {
            event.preventDefault();
            // focus first to grow the textarea, so we scroll to the correct location
            $('#comment').focus();
            scroll_to($('#bottom-save-btn'));
        });

    // needinfo in people section -> scroll to near-comment ui
    $('#needinfo-scroll')
        .click(function(event) {
            event.preventDefault();
            scroll_to($('#needinfo_role'), function() { $('#needinfo_role').focus(); });
        });

    // knob
    $('#bug_status')
        .change(function(event) {
            if (event.target.value == "RESOLVED" || event.target.value == "VERIFIED") {
                $('#resolution').change().show();
            }
            else {
                $('#resolution').hide();
                $('#duplicate-container').hide();
                $('#mark-as-dup-btn').show();
            }
        })
        .change();
    $('#resolution')
        .change(function(event) {
            var bug_status = $('#bug_status').val();
            if ((bug_status == "RESOLVED" || bug_status == "VERIFIED") && event.target.value == "DUPLICATE") {
                $('#duplicate-container').show();
                $('#mark-as-dup-btn').hide();
                $('#dup_id').focus();
            }
            else {
                $('#duplicate-container').hide();
                $('#mark-as-dup-btn').show();
            }
        })
        .change();
    $('#mark-as-dup-btn')
        .click(function(event) {
            event.preventDefault();
            $('#bug_status').val('RESOLVED').change();
            $('#resolution').val('DUPLICATE').change();
            $('#dup_id').focus();
        });

    // add see-also button
    $('.bug-urls-btn')
        .click(function(event) {
            event.preventDefault();
            var name = event.target.id.replace(/-btn$/, '');
            $(event.target).hide();
            $('#' + name).show().focus();
        });

    // bug flag value <select>
    $('.bug-flag')
        .change(function(event) {
            var target = $(event.target);
            var id = target.prop('id').replace(/^flag(_type)?-(\d+)/, "#requestee$1-$2");
            if (target.val() == '?') {
                $(id + '-container').show();
                $(id).focus().select();
            }
            else {
                $(id + '-container').hide();
            }
        });

    // tracking flags
    $('.tracking-flags select')
        .change(function(event) {
            tracking_flag_change(event.target);
        });

    // add attachments
    $('#attachments-add-btn')
        .click(function(event) {
            event.preventDefault();
            window.location.href = 'attachment.cgi?bugid=' + BUGZILLA.bug_id + '&action=enter';
        });

    // take button
    $('#take-btn')
        .click(function(event) {
            event.preventDefault();
            $('#field-assigned_to.edit-hide').hide();
            $('#field-assigned_to.edit-show').show();
            $('#assigned_to').val(BUGZILLA.user.login).focus().select();
            $('#top-save-btn').show();
        });

    // reply button
    $('.reply-btn')
        .click(function(event) {
            event.preventDefault();
            var comment_id = $(event.target).data('reply-id');
            var comment_author = $(event.target).data('reply-name');

            var prefix = "(In reply to " + comment_author + " from comment #" + comment_id + ")\n";
            var reply_text = "";
            if (BUGZILLA.user.settings.quote_replies == 'quoted_reply') {
                var text = $('#ct-' + comment_id).text();
                reply_text = prefix + wrapReplyText(text);
            }
            else if (BUGZILLA.user.settings.quote_replies == 'simply_reply') {
                reply_text = prefix;
            }

            // quoting a private comment, check the 'private' cb
            $('#add-comment-private-cb').prop('checked',
                $('#add-comment-private-cb:checked').length || $('#is-private-' + comment_id + ':checked').length);

            // remove embedded links to attachment details
            reply_text = reply_text.replace(/(attachment\s+\d+)(\s+\[[^\[\n]+\])+/gi, '$1');

            if ($('#comment').val() != reply_text) {
                $('#comment').val($('#comment').val() + reply_text);
            }
            scroll_to($('#comment'), function() { $('#comment').focus(); });
        });

    // add comment --> enlarge on focus
    if (BUGZILLA.user.settings.zoom_textareas) {
        $('#comment')
            .focus(function(event) {
                $(event.target).attr('rows', 25);
            });
    }

    // add comment --> private
    $('#add-comment-private-cb')
        .click(function(event) {
            if ($(event.target).prop('checked')) {
                $('#comment').addClass('private-comment');
            }
            else {
                $('#comment').removeClass('private-comment');
            }
        });

    // show "save changes" button if there are any immediately editable elements
    if ($('.module select:visible').length || $('.module input:visible').length) {
        $('#top-save-btn').show();
    }

    // status/resolve as buttons
    $('.resolution-btn')
        .click(function(event) {
            event.preventDefault();
            $('#field-status-view').hide();
            $('#field-status-edit').show();
            $('#bug_status').val('RESOLVED').change();
            $('#resolution').val($(event.target).text()).change();
            $('#top-save-btn').show();
            if ($(event.target).text() == "DUPLICATE") {
                scroll_to($('body'));
            }
            else {
                scroll_to($('body'), function() { $('#resolution').focus(); });
            }
        });
    $('.status-btn')
        .click(function(event) {
            event.preventDefault();
            $('#field-status-view').hide();
            $('#field-status-edit').show();
            $('#bug_status').val($(event.target).data('status')).change();
            $('#top-save-btn').show();
            scroll_to($('body'), function() { $('#bug_status').focus(); });
        });

    // vote button
    // ideally this should function like CC and xhr it, but that would require
    // a rewrite of the voting extension
    $('#vote-btn')
        .click(function(event) {
            event.preventDefault();
            window.location.href = 'page.cgi?id=voting/user.html&bug_id=' + BUGZILLA.bug_id + '#vote_' + BUGZILLA.bug_id;
        });

    // user-story
    $('#user-story-edit-btn')
        .click(function(event) {
            event.preventDefault();
            $('#user-story').hide();
            $('#user-story-edit-btn').hide();
            $('#cf_user_story').show().focus().select();
            $('#top-save-btn').show();
        });
    $('#user-story-reply-btn')
        .click(function(event) {
            event.preventDefault();
            var text = "(Commenting on User Story)\n" + wrapReplyText($('#cf_user_story').val());
            var current = $('#comment').val();
            if (current != text) {
                $('#comment').val(current + text);
                $('#comment').focus();
                scroll_to($('#bottom-save-btn'));
            }
        });

    // custom textarea fields
    $('.edit-textarea-btn')
        .click(function(event) {
            event.preventDefault();
            var id = $(event.target).attr('id').replace(/-edit$/, '');
            $(event.target).hide();
            $('#' + id + '-view').hide();
            $('#' + id).show().focus().select();
        });

    // date/datetime pickers
    $('.cf_datetime').datetimepicker({
        format: 'Y-m-d G:i:s',
        datepicker: true,
        timepicker: true,
        scrollInput: false,
        lazyInit: false, // there's a bug which prevents img->show from working with lazy:true
        closeOnDateSelect: true
    });
    $('.cf_date').datetimepicker({
        format: 'Y-m-d',
        datepicker: true,
        timepicker: false,
        scrollInput: false,
        lazyInit: false,
        closeOnDateSelect: true
    });
    $('.cf_datetime-img, .cf_date-img')
        .click(function(event) {
            var id = $(event.target).attr('id').replace(/-img$/, '');
            $('#' + id).datetimepicker('show');
        });

    // new bug button
    $.contextMenu({
        selector: '#new-bug-btn',
        trigger: 'left',
        items: [
            {
                name: 'Create a new Bug',
                callback: function() {
                    window.open('enter_bug.cgi', '_blank');
                }
            },
            {
                name: '\u2026 in this product',
                callback: function() {
                    window.open('enter_bug.cgi?product=' + encodeURIComponent($('#product').val()), '_blank');
                }
            },
            {
                name: '\u2026 in this component',
                callback: function() {
                    window.open('enter_bug.cgi?' +
                                'product=' + encodeURIComponent($('#product').val()) +
                                '&component=' + encodeURIComponent($('#component').val()), '_blank');
                }
            },
            {
                name: '\u2026 that blocks this bug',
                callback: function() {
                    window.open('enter_bug.cgi?format=__default__' +
                                '&product=' + encodeURIComponent($('#product').val()) +
                                '&blocked=' + BUGZILLA.bug_id, '_blank');
                }
            },
            {
                name: '\u2026 that depends on this bug',
                callback: function() {
                    window.open('enter_bug.cgi?format=__default__' +
                                '&product=' + encodeURIComponent($('#product').val()) +
                                '&dependson=' + BUGZILLA.bug_id, '_blank');
                }
            },
            {
                name: '\u2026 as a clone of this bug',
                callback: function() {
                    window.open('enter_bug.cgi?format=__default__' +
                                '&product=' + encodeURIComponent($('#product').val()) +
                                '&cloned_bug_id=' + BUGZILLA.bug_id, '_blank');
                }
            },
            {
                name: '\u2026 as a clone, in a different product',
                callback: function() {
                    window.open('enter_bug.cgi?format=__default__' +
                                '&cloned_bug_id=' + BUGZILLA.bug_id, '_blank');
                }
            },
        ]
    });

    // "reset to default" checkboxes
    $('#product, #component')
        .change(function(event) {
            $('.set-default-container').show();
            $('#set-default-assignee').prop('checked', $('#assigned_to').val() == BUGZILLA.default_assignee).change();
            $('#set-default-qa-contact').prop('checked', $('#qa_contact').val() == BUGZILLA.default_qa_contact).change();
            slide_module($('#module-people'), 'show');
        });
    $('.set-default')
        .change(function(event) {
            var cb = $(event.target);
            var input = $('#' + cb.data('for'));
            input.attr('disabled', cb.prop('checked'));
        })
        .change();

    // hotkeys
    $(window)
        .keydown(function(event) {
            if (!(event.ctrlKey || event.metaKey))
                return;
            switch(String.fromCharCode(event.which).toLowerCase()) {
                // ctrl+e or meta+e = enter edit mode
                case 'e':
                    // don't conflict with text input shortcut
                    if (document.activeElement.nodeNode == 'INPUT' || document.activeElement.nodeName == 'TEXTAREA')
                        return;
                    if ($('#cancel-btn:visible').length === 0) {
                        event.preventDefault();
                        $('#mode-btn').click();
                    }
                    break;

                // ctrl+shift+p = toggle comment preview
                case 'p':
                    if (event.metaKey || !event.shiftKey)
                        return;
                    if (document.activeElement.id == 'comment') {
                        event.preventDefault();
                        $('#comment-preview-tab').click();
                    }
                    else if ($('#comment-preview:visible').length !== 0) {
                        event.preventDefault();
                        $('#comment-edit-tab').click();
                    }
                    break;
            }
        });

    // add cc button
    $('#add-cc-btn')
        .click(function(event) {
            event.preventDefault();
            $('#add-cc-btn').hide();
            $('#add-cc-container').show();
            $('#top-save-btn').show();
            $('#add-cc').focus();
        });


    // product change --> load components, versions, milestones, groups
    $('#product').data('default', $('#product').val());
    $('#component, #version, #target_milestone').each(function() {
        $(this).data('default', $(this).val());
    });
    $('#product')
        .change(function(event) {
            $('#product-throbber').show();
            $('#component, #version, #target_milestone').attr('disabled', true);

            slide_module($('#module-tracking'), 'show');

            $.each($('input[name=groups]'), function() {
                if (this.checked) {
                    slide_module($('#module-security'), 'show');
                    return false;
                }
            });

            bugzilla_ajax(
                {
                    url: 'rest/bug_modal/new_product/' + BUGZILLA.bug_id + '?product=' + encodeURIComponent($('#product').val())
                },
                function(data) {
                    $('#product-throbber').hide();
                    $('#component, #version, #target_milestone').attr('disabled', false);
                    var is_default = $('#product').val() == $('#product').data('default');

                    // populate selects
                    $.each(data, function(key, value) {
                        if (key == 'groups') return;
                        var el = $('#' + key);
                        if (!el) return;
                        el.empty();
                        var selected = el.data('preselect');
                        $(value).each(function(i, v) {
                            el.append($('<option>', { value: v.name, text: v.name }));
                            if (typeof selected === 'undefined' && v.selected)
                                selected = v.name;
                        });
                        el.val(selected);
                        el.prop('required', true);
                        if (is_default) {
                            el.removeClass('attention');
                            el.val(el.data('default'));
                        }
                        else {
                            el.addClass('attention');
                        }
                    });

                    // update groups
                    $('#module-security .module-content')
                        .html(data.groups)
                        .addClass('attention');
                },
                function() {
                    $('#product-throbber').hide();
                    $('#component, #version, #target_milestone').attr('disabled', false);
                }
            );
        });

    // product/component search
    $('#product-search')
        .click(function(event) {
            event.preventDefault();
            $('#product').hide();
            $('#product-search').hide();
            $('#product-search-cancel').show();
            $('.pcs-form').show();
            $('#pcs').val('').focus();
        });
    $('#product-search-cancel')
        .click(function(event) {
            event.preventDefault();
            $('#product-search-error').hide();
            $('.pcs-form').hide();
            $('#product').show();
            $('#product-search-cancel').hide();
            $('#product-search').show();
        });
    $('#pcs')
        .on('autocompleteselect', function(event, ui) {
            $('#product-search-error').hide();
            $('.pcs-form').hide();
            $('#product-search-cancel').hide();
            $('#product-search').show();
            if ($('#product').val() != ui.item.product) {
                $('#component').data('preselect', ui.item.component);
                $('#product').val(ui.item.product).change();
            }
            else {
                $('#component').val(ui.item.component);
            }
            $('#product').show();
        })
        .autocomplete('option', 'autoFocus', true)
        .keydown(function(event) {
            if (event.which == 13) {
                event.preventDefault();
                var enterKeyEvent = $.Event("keydown");
                enterKeyEvent.keyCode = $.ui.keyCode.ENTER;
                $('#pcs').trigger(enterKeyEvent);
            }
        });
    $(document)
        .on('pcs:search', function(event) {
            $('#product-search-error').hide();
        })
        .on('pcs:results', function(event) {
            $('#product-search-error').hide();
        })
        .on('pcs:no_results', function(event) {
            $('#product-search-error')
                .prop('title', 'No components found')
                .show();
        })
        .on('pcs:too_many_results', function(event, el) {
            $('#product-search-error')
                .prop('title', 'Results limited to ' + el.data('max_results') + ' components')
                .show();
        })
        .on('pcs:error', function(event, message) {
            $('#product-search-error')
                .prop('title', message)
                .show();
        });

    // comment preview
    var last_comment_text = '';
    $('#comment-tabs li').click(function() {
        var that = $(this);
        if (that.hasClass('current'))
            return;

        // ensure preview's height matches the comment
        var comment = $('#comment');
        var preview = $('#comment-preview');
        var comment_height = comment[0].offsetHeight;

        // change tabs
        $('#comment-tabs li').removeClass('current').attr('aria-selected', false);
        $('.comment-tab').hide();
        that.addClass('current').attr('aria-selected', true);
        var tab = that.attr('data-tab');
        $('#' + tab).show();
        var focus = that.data('focus');
        if (focus === '') {
            document.activeElement.blur();
        }
        else {
            $('#' + focus).focus();
        }

        // update preview
        preview.css('height', comment_height + 'px');
        if (tab != 'comment-tab-preview' || last_comment_text == comment.val())
            return;
        $('#preview-throbber').show();
        preview.html('');
        bugzilla_ajax(
            {
                url: 'rest/bug/comment/render',
                type: 'POST',
                data: { text: comment.val() },
                hideError: true
            },
            function(data) {
                $('#preview-throbber').hide();
                preview.html(data.html);
            },
            function(message) {
                $('#preview-throbber').hide();
                var container = $('<div/>');
                container.addClass('preview-error');
                container.text(message);
                preview.html(container);
            }
        );
        last_comment_text = comment.val();
    });

    // dirty field tracking
    $('#changeform select')
        .change(function() {
            var that = $(this);
            var dirty = $('#' + that.attr('id') + '-dirty');
            if (!dirty) return;
            if (that.attr('multiple')) {
                var preselected = that.data('preselected');
                var selected = that.val();
                var isDirty = preselected.length != selected.length;
                if (!isDirty) {
                    for (var i = 0, l = preselected.length; i < l; i++) {
                        if (selected[i] != preselected[i]) {
                            isDirty = true;
                            break;
                        }
                    }
                }
                dirty.val(isDirty ? '1' : '');
            }
            else {
                dirty.val(that.val() === that.data('preselected')[0] ? '' : '1');
            }
        });
});

function confirmUnsafeURL(url) {
    return confirm(
        'This is considered an unsafe URL and could possibly be harmful.\n' +
        'The full URL is:\n\n' + url + '\n\nContinue?');
}

// fix url after bug creation/update
if (history && history.replaceState) {
    var href = document.location.href;
    if (!href.match(/show_bug\.cgi/)) {
        history.replaceState(null, BUGZILLA.bug_title, 'show_bug.cgi?id=' + BUGZILLA.bug_id);
        document.title = BUGZILLA.bug_title;
    }
    if (href.match(/show_bug\.cgi\?.*list_id=/)) {
        href = href.replace(/[\?&]+list_id=(\d+|cookie)/, '');
        history.replaceState(null, BUGZILLA.bug_title, href);
    }
}

// ajax wrapper, to simplify error handling and auth
function bugzilla_ajax(request, done_fn, error_fn) {
    $('#xhr-error').hide('');
    $('#xhr-error').html('');
    request.url += (request.url.match('\\?') ? '&' : '?') +
        'Bugzilla_api_token=' + encodeURIComponent(BUGZILLA.api_token);
    if (request.type != 'GET') {
        request.contentType = 'application/json';
        request.processData = false;
        if (request.data && request.data.constructor === Object) {
            request.data = JSON.stringify(request.data);
        }
    }
    $.ajax(request)
        .done(function(data) {
            if (data.error) {
                $('#xhr-error').html(data.message);
                $('#xhr-error').show('fast');
                if (error_fn)
                    error_fn(data.message);
            }
            else if (done_fn) {
                done_fn(data);
            }
        })
        .error(function(data) {
            var message = data.responseJSON ? data.responseJSON.message : 'Unexpected Error'; // all errors are unexpected :)
            if (!request.hideError) {
                $('#xhr-error').html(message);
                $('#xhr-error').show('fast');
            }
            if (error_fn)
                error_fn(message);
        });
}

// lightbox

function lb_show(el) {
    $(window).trigger('close');
    $(document).bind('keyup.lb', function(event) {
        if (event.keyCode == 27) {
            lb_close(event);
        }
    });
    var overlay = $('<div>')
        .prop('id', 'lb_overlay')
        .css({ opacity: 0 })
        .appendTo('body');
    var overlay2 = $('<div>')
        .prop('id', 'lb_overlay2')
        .css({ top: $(window).scrollTop() + 5 })
        .appendTo('body');
    var title = $('<div>')
        .prop('id', 'lb_text')
        .appendTo(overlay2);
    var img = $('<img>')
        .prop('id', 'lb_img')
        .prop('src', el.href)
        .prop('alt', 'Loading...')
        .css({ opacity: 0 })
        .appendTo(overlay2)
        .click(function(event) {
            event.stopPropagation();
            window.location.href = el.href;
        });
    var close_btn = $('<button>')
        .prop('id', 'lb_close_btn')
        .prop('type', 'button')
        .addClass('minor')
        .text('Close')
        .appendTo(overlay2);
    title.append(el.title);
    overlay.add(overlay2).click(lb_close);
    img.add(overlay).animate({ opacity: 1 }, 200);
}

function lb_close(event) {
    event.preventDefault();
    $(document).unbind('keyup.lb');
    $('#lb_overlay, #lb_overlay2, #lb_close_btn, #lb_img, #lb_text').remove();
}

// no-ops
function initHidingOptionsForIE() {}
function showFieldWhen() {}
