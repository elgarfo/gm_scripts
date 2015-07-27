// ==UserScript==
// @name         Hacker Experience Tools
// @namespace    https://github.com/elgarfo/hetools
// @version      0.1
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

//utils
function isPage(url)
{
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

//functions
function showComputerStatus()
{
    var ip = $('input.browser-bar:first').val();
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