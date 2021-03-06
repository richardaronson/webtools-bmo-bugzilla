/* The contents of this file are subject to the Mozilla Public
* License Version 1.1 (the "License"); you may not use this file
* except in compliance with the License. You may obtain a copy of
* the License at http://www.mozilla.org/MPL/
*
* Software distributed under the License is distributed on an "AS
* IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
* implied. See the License for the specific language governing
* rights and limitations under the License.
*
* The Original Code is the Bugzilla Bug Tracking System.
*
* Contributor(s): 
*   Guy Pyrzak <guy.pyrzak@gmail.com>
*   Max Kanat-Alexander <mkanat@bugzilla.org>
*                 
*/

function show_mini_login_form( suffix ) {
    $('#login_link' + suffix).addClass('bz_default_hidden');
    $('#mini_login' + suffix).removeClass('bz_default_hidden');
    $('#new_account_container' + suffix).addClass('bz_default_hidden');
    return false;
}

function hide_mini_login_form( suffix ) {
    $('#login_link' + suffix).removeClass('bz_default_hidden');
    $('#mini_login' + suffix).addClass('bz_default_hidden');
    $('#new_account_container' + suffix).removeClass('bz_default_hidden');
    return false;
}

function show_forgot_form( suffix ) {
    $('#forgot_link' + suffix).addClass('bz_default_hidden');
    $('#forgot_form' + suffix).removeClass('bz_default_hidden');
    $('#login_container' + suffix).addClass('bz_default_hidden');
    return false;
}

function hide_forgot_form( suffix ) {
    $('#forgot_link' + suffix).removeClass('bz_default_hidden');
    $('#forgot_form' + suffix).addClass('bz_default_hidden');
    $('#login_container' + suffix).removeClass('bz_default_hidden');
    return false;
}

function init_mini_login_form( suffix ) {
    var mini_login = document.getElementById('Bugzilla_login' +  suffix );
    var mini_password = document.getElementById('Bugzilla_password' +  suffix );
    var mini_dummy = document.getElementById('Bugzilla_password_dummy' + suffix);
    // If the login and password are blank when the page loads, we display
    // "login" and "password" in the boxes by default.
    if (mini_login.value == "" && mini_password.value == "") {
        YAHOO.util.Dom.addClass(mini_password, 'bz_default_hidden');
        YAHOO.util.Dom.removeClass(mini_dummy, 'bz_default_hidden');
    }
    else {
        show_mini_login_form(suffix);
    }
}

function check_mini_login_fields( suffix ) {
    var mini_login = document.getElementById('Bugzilla_login' +  suffix );
    var mini_password = document.getElementById('Bugzilla_password' +  suffix );
    if (mini_login.value != "" && mini_password.value != "") {
        return true;
    } else {
        window.alert("You must provide the email address and password before logging in.");
        return false;
    }
}

function set_language( value ) {
    $.cookie('LANG', value, {
        expires: new Date('January 1, 2038'),
        path: BUGZILLA.param.cookie_path
    });
    window.location.reload()
}

// This basically duplicates Bugzilla::Util::display_value for code that
// can't go through the template and has to be in JS.
function display_value(field, value) {
    var field_trans = BUGZILLA.value_descs[field];
    if (!field_trans) return value;
    var translated = field_trans[value];
    if (translated) return translated;
    return value;
}
