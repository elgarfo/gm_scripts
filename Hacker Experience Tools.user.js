// ==UserScript==
// @name         Hacker Experience Tools
// @namespace    https://github.com/elgarfo/hetools
// @version      0.2
// @description  hacker experience tools
// @author       elgarfo
// @match        *://hackerexperience.com/*
// @require      https://ajax.googleapis.com/ajax/libs/jquery/2.1.4/jquery.min.js
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @grant        GM_deleteValue
// ==/UserScript==

//globals
var __periodicComputerUpdateScheduled = false;
var __periodicComputerUpdateSetup = false;
var __periodicComputerUpdateSeconds = 30;

//do your thing!
periodicComputerUpdater(); //periodically update computer list
isPage('missions') && hideHiddenMissions();
isPage('internet') && showComputerStatus();
isPage('list') && updateHackedComputers();
isPage('bankaccounts') && updateHackedBankAccounts();
isPage('internet?action=login&type=bank') && showEasyBankLogin();
isPage('internet?bAction=show') && showTransferHelper();
isPage('finances') && updateOwnedBankAccounts();

//utils
function isPage(url)
{
    url = url.replace('?', '\\?');
    return window.location.href.search(url) > 0;
}

function displaySuccess(message)
{
    if($('.alert').length !== 0)
    {
        $('.alert').remove();
    }
    $('.widget-box:first').before('<div class="alert alert-success"><button class="close" data-dismiss="alert">x</button><strong>Success!</strong> '+ message +' </div>');
}

function displayError(message){

    if($('.alert').length !== 0) {
        $('.alert').remove();
    }
    $('.widget-box:first').before('<div class="alert alert-error"><button class="close" data-dismiss="alert">x</button><strong>Error!</strong> '+ message +' </div>');
}

function getIP()
{
    return $('input.browser-bar:first').val();
}

//functions

function showTransferHelper()
{
    var aOwnedBankAccounts = JSON.parse(GM_getValue('jOwnedBankAccounts'));

    var dd = $('<select></select>')
        .prop('name', 'acc')
        .on('change', function() {
            var ip = $(this).find('option:selected:first').data('ip');
            console.log('chaning ip to: ' + ip);
            $('select[name=acc]:first').parent().parent().find('input[name=ip]:first').val(ip);
        })
    ;

    //build dropdown options
    for(var i = 0; i < aOwnedBankAccounts.length; i++)
    {
        $('<option></option>')
            .html(aOwnedBankAccounts[i].acc + '(' + aOwnedBankAccounts[i].bank + ')')
            .prop('value', aOwnedBankAccounts[i].acc)
            .data('ip', aOwnedBankAccounts[i].ip)
            .appendTo(dd)
        ;
    }

    //replace input with dropdown
    $('input[name=acc]:first').replaceWith(dd);
}

function showEasyBankLogin()
{
    var ip = getIP();
    var aBankAccounts = getBankAccountsForIP(ip);

    var dd = $('<select></select>')
        .prop('name', 'acc')
        .on('change', function() {
            var password = $(this).find('option:selected:first').data('password');
            $('#loginform input[name=pass]:first').val(password);
        })
    ;

    //build dropdown options
    for(var i = 0; i < aBankAccounts.length; i++)
    {
        var oAcc = aBankAccounts[i];

        $('<option></option>')
            .html(oAcc.acc + " ($" + oAcc.amount + ")")
            .prop('value', oAcc.acc)
            .data('password', oAcc.pw)
            .appendTo(dd)
        ;
    }

    //hide password input
    $('#loginform input[name=pass]:first').parent().parent().parent().hide();

    //replace input with dropdown
    $('#loginform input[name=acc]:first').replaceWith(dd);
}

function getBankAccountsForIP(ip)
{
    var aMatchingAccounts = [];

    var aBankAccounts = JSON.parse(GM_getValue('jBankAccounts'));
    for(var i = 0; i < aBankAccounts.length; i++)
    {
        if(aBankAccounts[i].ip == ip)
        {
            aMatchingAccounts.push(aBankAccounts[i]);
        }
    }

    return aMatchingAccounts;
}

function showComputerStatus()
{
    var ip = getIP();
    var content = '';
    if(!computerHasVirus(ip))
    {
        content = $('<table><tr><th>IP</th><td>' + ip + '</td></tr><tr><th>Virus</th><td><span class="icon"><span class="he16-stop"></span></span></td></tr></table>');
    }
    else
    {
        content = $('<table><tr><th>IP</th><td>' + ip + '</td></tr><tr><th>Virus</th><td><span class="icon"><span class="he16-97"></span></span></td></tr></table>');
    }

    var box = getCollapsibleWidgetBox('computerinfo', 'he16-list_ip', 'Computer Information', content);

    $('.widget-box.collapsible:first').before(box);
}

function computerHasVirus(ip)
{
    var aComputers = JSON.parse(GM_getValue('jComputers'));
    for(var i = 0; i < aComputers.length; i++)
    {
        if(aComputers[i].ip == ip)
        {
            return aComputers[i].virusActive;
        }
    }
}

function periodicComputerUpdater()
{
    //check if interval is already setup
    if(!__periodicComputerUpdateSetup)
    {
        __periodicComputerUpdateSetup = true;
        setInterval(periodicComputerUpdater, 1000);
    }

    //only run if no update is scheduled
    if(!__periodicComputerUpdateScheduled)
    {
        var currentTime = Date.now();
        var lastUpdate = GM_getValue('periodicComputerUpdater_lastUpdate');
        var nextUpdate = lastUpdate + (__periodicComputerUpdateSeconds * 1000);
        if(currentTime > nextUpdate)
        {
            updateHackedComputers();
        }
        else
        {
            var updateDelta = nextUpdate - currentTime;
            setTimeout(function() {
                updateHackedComputers();
                __periodicComputerUpdateScheduled = false;
            }, updateDelta);
            __periodicComputerUpdateScheduled = true;
        }
    }
}

function hideHiddenMissions()
{
    $('td:contains("This mission is hidden.")')
        .each(function(i,e){
            $(this)
                .parent()
                .hide()
            ;
        })
    ;
}

function getHackedComputerPages()
{
    var pages = 0;

    $.ajax({
        url: 'https://hackerexperience.com/list',
        type: 'get',
        async: false,
        success: function(r) {
            pages = $(r).find('.pagination li').length - 2;
        },
    });

    return pages;
}

function updateHackedComputers() {
    var aComputers = [];
    var pages = getHackedComputerPages();

    for(var page = 1; page <= pages; page++)
    {
        $.ajax({
            url: 'https://hackerexperience.com/list?page=' + page,
            type: 'get',
            async: false,
            success: function(r) {
                $(r).find('ul.list.ip > li').each(function(i,e){
                    var ip = $(this).find('span#ip').html();
                    var virus = $(this).find('span#vname').html();
                    var i = aComputers.push({
                        ip: ip,
                        virus: virus,
                        virusActive: virus.length > 0,
                    });
                });
            },
        });
    }

    GM_setValue('jComputers', JSON.stringify(aComputers));
    GM_setValue('periodicComputerUpdater_lastUpdate', Date.now());
}

function getHackedBankAccountPages()
{
    var pages = 0;

    $.ajax({
        url: 'https://hackerexperience.com/list',
        type: 'get',
        async: false,
        success: function(r) {
            pages = $(r).find('.pagination li').length - 2;
        },
    });

    return pages;
}

function updateHackedBankAccounts() {
    var aBankAccounts = [];
    var pages = getHackedBankAccountPages();

    for(var page = 1; page <= pages; page++)
    {
        $.ajax({
            url: 'https://hackerexperience.com/list?show=bankaccounts&page=' + page,
            type: 'get',
            async: false,
            success: function(r) {
                $(r).find('ul.list.acc > li').each(function(i,e){
                    var acc = $(this).find('span#acc').html();
                    var pw = $(this).find('div.list-user > small:first').html();
                    var ip = $(this).find('div.list-bankip > a').text();

                    var amount = $(this).find('div.list-amount:first').html();
                    var iAmount = parseInt(amount.replace('$', '').replace(',',''))

                    var i = aBankAccounts.push({
                        ip: ip,
                        amount: iAmount,
                        acc: acc,
                        pw: pw,
                    });
                });
            },
        });
    }

    GM_setValue('jBankAccounts', JSON.stringify(aBankAccounts));
}

function updateOwnedBankAccounts() {
    var aOwnedBankAccounts = [];

    var aAccDivs = $('div[id^=acc]');

    for(var i = 0; i < aAccDivs.length; i++)
    {
        var ip = $(aAccDivs[i]).parent().find('div.widget-title > a[href^=internet]').prop('href').match(/((\d{1,3}\.?){1,4})$/)[0];
        var acc = $(aAccDivs[i]).text().match(/#(\d+)/)[1];
        var bank = $(aAccDivs[i]).find('strong:first').html();

        aOwnedBankAccounts.push({
            ip: ip,
            acc: acc,
            bank: bank,
        });
    }

    GM_setValue('jOwnedBankAccounts', JSON.stringify(aOwnedBankAccounts));
}


//templates
function getCollapsibleWidgetBox(p_name, p_icon, p_title, p_content)
{
	var title = $('<div></div>')
		.addClass('widget-title')
		.append('<a></a>').find('a:first')
			.append('<span></span>').find('span:first')
				.addClass('icon')
				.append('<span></span>').find('span:first')
					.addClass(p_icon)
				.end()
			.end()
			.append('<h5></h5>').find('h5:first')
				.html(p_title)
			.end()
		.end()
	;

	var content = $('<div></div>')
		.addClass('collapse in')
		.prop('id', p_name)
		.append('<div></div>').find('div:first')
			.addClass('widget-content')
			.html(p_content)
		.end()
	;

	var box = $('<div></div>')
		.addClass('widget-box')
		.addClass('collapsible')
		.append(title)
		.append(content);

    return box;
}