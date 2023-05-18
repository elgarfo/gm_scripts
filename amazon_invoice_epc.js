// ==UserScript==
// @name         amazon monthly invoice EPC-QR embedder
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  display an EPC-QR code on amazons monthly invoice page to scan with your banking app
// @author       elgarfo
// @match        https://www.amazon.de/cpe/myinvoices?statementId=*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amazon.de
// @grant        GM_log
// @require      http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js
// ==/UserScript==
(function() {
    'use strict';

    const eForm = $('form[action*="myinvoices"]');
    const aExpander = eForm.find('.a-expander-inner');
    //the first one is currently FAQ
    //the second one is payment data
    const paymentDataExpander = $(aExpander[1]);
    const aRows = paymentDataExpander.find('.a-column.a-span6 > .a-row:not(.a-spacing-top-small)');

    //find the iban row
    let iban_row = -1;
    aRows.each((i,e) => {
        if($(e).text().match(/^[A-Za-z]{2}[0-9]{2}[A-Za-z0-9]{11,30}$/))
        {
          GM_log('iban row has index: ' + i);
          iban_row = i;
        }
    });

    if(iban_row < 0)
    {
        GM_log('iban row not found.');
        return;
    }

    const name = $(aRows[iban_row - 1]).text();
    const iban = $(aRows[iban_row]).text();
    const ref = $(aRows[iban_row + 1]).text();

    //get payment amount
    let amount = 0.0;
    //amazons DOM is completely devoid of any sematic hints.
    //this is basically the current best matcher
    //$('.a-column.a-span4.pmts-right-padding > .a-row.a-spacing-top-micro > .a-column.a-span6.a-text-right.a-span-last')
    //and its shorter version
    const eAmountOpen = $('.a-column > .a-spacing-top-micro > .a-span-last');
    if(eAmountOpen.text().match(/^EUR/))
    {
      amount = parseFloat(eAmountOpen.text().replace(/^EUR/, '').trim());
    }
    else
    {
        GM_log('unable to find payment amount');
        return;
    }

    const qrimgsrc = `https://sepa-epc-png.onrender.com/?name=${name}&iban=${iban}&ref=${ref}&amount=${amount}`;
    GM_log(`embedding: ${qrimgsrc}`);
    $(eForm).prepend(`
      <div id="sepa-epc-div">
        <img id="sepa-epc-img" src="${qrimgsrc}" />
        <span id="sepa-epc-span">scan sepa epc-qr-code with your banking app for easy payment</span>
      </div>
    `);
    $("#sepa-epc-div").css({
        display:    "block",
        position:   "relative",
        width:      "500px",
        height:     "200px",
    });
    $('#sepa-epc-div > *').css({
        display: 'inline-block',
        width: '200px',
        height: '200px',
    });
    $('#sepa-epc-span').css({ 'padding-top': '50px' });
})();
