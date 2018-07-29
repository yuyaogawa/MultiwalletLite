    function updateBalances(){
        $.when( getBalanceBTC(), getBalanceLTC() , getBalanceETH() )
        .then(function(){
        $('#balanceLTC').text(balanceLTC + ' LTC');
        $('#balanceBTC').text(balanceBTC + ' BTC');
        $('#balanceETH').text(balanceETH + ' ETH');
        $('#currencyLTC').text(' ≈ ' + sym + (balanceLTC*objCurrency[currency].ltc).toFixed(2) + currency);
        $('#currencyBTC').text(' ≈ ' + sym + (balanceBTC*objCurrency[currency].btc).toFixed(2) + currency);
        $('#currencyETH').text(' ≈ ' + sym + (balanceETH*objCurrency[currency].eth).toFixed(2) + currency);
        $('#balanceLTC2').text(balanceLTC + ' LTC');
        $('#balanceBTC2').text(balanceBTC + ' BTC');
        $('#balanceETH2').text(balanceETH + ' ETH');
        $('#currencyLTC2').text(' ≈ ' + sym + (balanceLTC*objCurrency[currency].ltc).toFixed(2) + currency);
        $('#currencyBTC2').text(' ≈ ' + sym + (balanceBTC*objCurrency[currency].btc).toFixed(2) + currency);
        $('#currencyETH2').text(' ≈ ' + sym + (balanceETH*objCurrency[currency].eth).toFixed(2) + currency);
        $('#currencyALL').text(' ≈ ' + sym + (balanceLTC*objCurrency[currency].ltc+ balanceBTC*objCurrency[currency].btc + balanceETH*objCurrency[currency].eth).toFixed(2) + currency);
        });
    }
    function getFeeLTC(){
        $.ajax({
            type: "GET",
            url: url_feeLTC,
            async: true,
            dataType: "json",
            timeout:TIMEOUT,
        })
        .done(function( json ) {
                    feeLTC_high = (json.high_fee_per_kb / 1000).toFixed(0);
                    feeLTC_medium = (json.medium_fee_per_kb / 1000).toFixed(0);
                    feeLTC_low = (json.low_fee_per_kb / 1000).toFixed(0);
          })
          .fail(function( xhr, status, errorThrown ) {
            showMessage(ERROR,MSG_FEE);
          })
          .always(function( xhr, status ) {
          });
    }
    function getFeeBTC(){
        $.ajax({
            type: "GET",
            url: url_feeBTC,
            async: true,
            dataType: "json",
            timeout:TIMEOUT,
        })
        .done(function( json ) {
                    feeBTC_high = (json.high_fee_per_kb / 1000).toFixed(0);
                    feeBTC_medium = (json.medium_fee_per_kb / 1000).toFixed(0);
                    feeBTC_low = (json.low_fee_per_kb / 1000).toFixed(0);
          })
          .fail(function( xhr, status, errorThrown ) {
            showMessage(ERROR,MSG_FEE);
          })
          .always(function( xhr, status ) {
          });
    }
    function getFeeETH(){
        $.ajax({
            type: "GET",
            url: url_feeETH,
            async: true,
            dataType: "json",
            timeout:TIMEOUT,
        })
        .done(function( json ) {
                    feeETH_high = (json.high_gas_price).toFixed(0);
                    feeETH_medium = (json.medium_gas_price).toFixed(0);
                    feeETH_low = (json.low_gas_price).toFixed(0);
          })
          .fail(function( xhr, status, errorThrown ) {
            showMessage(ERROR,MSG_FEE);
          })
          .always(function( xhr, status ) {
          });
    }
    function getBalanceBTC(address) {
        $.ajax({       
            type: "GET",
            url: url_addrBTC + addrBTC,
            async: true,
            dataType: "json",
        })
        .done(function( json ) {
            balanceBTC = btcFormat(parseFloat(json.balance) * 1e-8 + parseFloat(json.unconfirmed_balance) * 1e-8);
            //$('#historyBTC').find("hr:gt(3)").remove();
            var obj = json.txrefs;
            var i = 0;
          })
        .fail(function( json, status, errorThrown ) {
            historyBTCFlg = false;
          })
        .always(function( json, status ) {
            if(json.n_tx > 0){
                historyBTCFlg = true;
            }else{
                historyBTCFlg = false;
            }
          });
    }
    function getBalanceLTC(address) {
        var address = convert(addrLTC)
        $.ajax({       
            type: "GET",
            url: url_addrLTC + address,
            async: true,
            dataType: "json",
        })
        .done(function( json ) {
            balanceLTC = btcFormat(parseFloat(json.balance) * 1e-8 + parseFloat(json.unconfirmed_balance) * 1e-8);
            //$('#historyLTC').find("tr:gt(3)").remove();
            var obj = json.txrefs;
            var i = 0;
          })
        .fail(function( json, status, errorThrown ) {
            historyLTCFlg = false;
          })
        .always(function( json, status ) {
            if(json.n_tx > 0){
                historyLTCFlg = true;
            }else{
                historyLTCFlg = false;
            }
          });
    }
    function getBalanceETH(address) {
        $.ajax({       
            type: "GET",
            url: url_addrETH + addrETH,
            async: true,
            dataType: "json",
        })
        .done(function( json ) {
            balanceETH = btcFormat(parseFloat(json.balance) * 1e-18 + parseFloat(json.unconfirmed_balance) * 1e-18);
            nonce = json.nonce;
            //$('#historyETH').find("tr:gt(3)").remove();
            var obj = json.txrefs;
            var i = 0;
            if(json.txrefs.length > 0){
                historyETHFlg = true;
            }else{
                historyETHFlg = false;
            }
          })
        .fail(function( json, status, errorThrown ) {
            //alert( "Sorry, there was a problem!" );
            historyETHFlg = false;
          })
        .always(function( json, status ) {
            //alert( "The request is complete!" );
          });
    }    // Scan QRcode
    // The original library(dwa012/html5-qrcode) has a issue which is "Camera view hang when running it on mobile #8".
    // But also there is a fork to solve it, so I used the fork library as followed "enriquetuya/html5-qrcode"
    function scanQRcode(){
        $('#reader').empty();
        $('#reader').html5_qrcode(function(data){
                var scanArr = data.split("?");
                if(scanArr.length > 1){
                        document.getElementById('txtAmount').value = scanArr[1].replace('amount=','');
                }
                    if(myCrypto == 'LTC'){
                        document.getElementById('sendAddr').value = scanArr[0].replace('litecoin:','');
                    }else if(myCrypto == 'BTC'){
                        document.getElementById('sendAddr').value = scanArr[0].replace('bitcoin:','');
                    }else{
                        document.getElementById('sendAddr').value = scanArr[0].replace('ethereum:','');
                    }
                try{
                    if (!!window.stream) {
                        stream.getTracks().forEach(function (track) { track.stop(); });
                    }
                    $('#reader').value = null;
                    $("#ScannerModal").modal("hide");
                } catch(err){
                    console.log(err);
                }
            },
            function(error){
            //show read errors 
            }, function(videoError){
            //the video stream could be opened
            }
        );
    }
    // Stop Scanner
    function stopCamera(){
        try{
            //$('#reader').html5_qrcode_stop();
            //$('#reader').html5_qrcode().stop();
            if (!!window.stream) {
                stream.getTracks().forEach(function (track) { track.stop(); });
            }
            $('#reader').value = null;
        } catch(err){
            console.log(err);
        }
    }
    function dispLoading(){
        var h = $(window).height();
        $('#loader-bg ,#loader').height(h).css('display','block');
    }
    function removeLoading(){
        $('#loader-bg').delay(900).fadeOut(800);
        $('#loader').delay(600).fadeOut(300);
    }
    function showMessage(str,msg){
        if(str == ERROR){
            $('#errorMsg').html(msg);
            $("#error").fadeTo(9000, 500);
        }else if(str == SUCCESS){
            $('#success').html(msg);
                $("#success").fadeTo(9000, 500).slideUp(500, function(){
                $("#success").slideUp(500);
            });
        }else if(str == WRONGPASSWORD){
            $('#wrongPassword').html(msg);
                $("#wrongPassword").fadeTo(9000, 500).slideUp(500, function(){
                $("#wrongPassword").slideUp(500);
            });
        }else{
            alert("something wrong...");
        }
    }
    function setCookie(cookieName,cookieValue,nDays) {
        var today = new Date();
        var expire = new Date();
        if (nDays==null || nDays==0) nDays=1;
        expire.setTime(today.getTime() + 3600000*24*nDays);
        document.cookie = cookieName+"="+escape(cookieValue) + ";expires="+expire.toGMTString();
    }
    function readCookie(cookieName) {
        var theCookie=" "+document.cookie;
        var ind=theCookie.indexOf(" "+cookieName+"=");
        if (ind==-1) ind=theCookie.indexOf(";"+cookieName+"=");
        if (ind==-1 || cookieName=="") return "";
        var ind1=theCookie.indexOf(";",ind+1);
        if (ind1==-1) ind1=theCookie.length; 
        return unescape(theCookie.substring(ind+cookieName.length+2,ind1));
    }
    function openTab(evt, tabName) {
        // Declare all variables
        var i, tabcontent, tablinks;

        // Get all elements with class="tabcontent" and hide them
        tabcontent = document.getElementsByClassName("tabcontent");
        for (i = 0; i < tabcontent.length; i++) {
            tabcontent[i].style.display = "none";
        }

        // Get all elements with class="tablinks" and remove the class "active"
        tablinks = document.getElementsByClassName("tablinks");
        for (i = 0; i < tablinks.length; i++) {
            tablinks[i].className = tablinks[i].className.replace(" active", "");
        }

        // Show the current tab, and add an "active" class to the button that opened the tab
        document.getElementById(tabName).style.display = "block";
        evt.currentTarget.className += " active";

        // Change myCrypto
        if(tabName == "LTC"){
            $("#txtAmount").val('');
            $("#sendAddr").val('');
            $("#Recamount").val('');
            $("#feeSelect").empty();
            $("#feeSelect").append( "<option id='1' value='" + feeLTC_high + "'>" + feeLTC_high + " /byte (high) </option>" );
            $("#feeSelect").append( "<option id='2' value='" + feeLTC_medium + "'>" + feeLTC_medium + " /byte (medium) </option>" );
            $("#feeSelect").append( "<option id='3' value='" + feeLTC_low + "'>" + feeLTC_low + " /byte (low) </option>" );
            feeLTC = feeLTC_medium;
            $("select#feeSelect").find("option#2").attr("selected", true);

            if(historyLTCFlg){
                $("#historyLTC").show();
            }else{
                $("#nohistoryLTC").show();
            }
            $("#historyBTC").hide();
            $("#nohistoryBTC").hide();
            $("#historyETH").hide();
            $("#nohistoryETH").hide();
            redeemScript = redeemScriptLTC;
            fee = feeLTC;
            address = addrLTC;
            network = Bitcoin.networks.litecoin;
            keyPair = keyPairLTC;
            fiatvalue = objCurrency[currency].ltc;
            myCrypto = 'LTC';
            url_utxo = 'https://chain.so/api/v2/get_tx_unspent/LTC/';
            url_send = 'https://chain.so//api/v2/send_tx/LTC';
            mySymbol = "Ł"
            dex.changeType();
        }else if(tabName == "BTC"){
            $("#txtAmount").val('');
            $("#sendAddr").val('');
            $("#Recamount").val('');
            $("#feeSelect").empty();
            $("#feeSelect").append( "<option id='1' value='" + feeBTC_high + "'>" + feeBTC_high + " /byte (high) </option>" );
            $("#feeSelect").append( "<option id='2' value='" + feeBTC_medium + "'>" + feeBTC_medium + " /byte (medium) </option>" );
            $("#feeSelect").append( "<option id='3' value='" + feeBTC_low + "'>" + feeBTC_low + " /byte (low) </option>" );
            feeBTC = feeBTC_medium;
            $("select#feeSelect").find("option#2").attr("selected", true);

            if(historyBTCFlg){
                $("#historyBTC").show();
            }else{
                $("#nohistoryBTC").show();
            }
            $("#historyLTC").hide();
            $("#nohistoryLTC").hide();
            $("#historyETH").hide();
            $("#nohistoryETH").hide();
            redeemScript = redeemScriptBTC;
            fee = feeBTC;
            address = addrBTC;
            network = Bitcoin.networks.bitcoin;
            keyPair = keyPairBTC;
            fiatvalue = objCurrency[currency].btc;
            myCrypto = 'BTC';
            url_utxo = 'https://chain.so/api/v2/get_tx_unspent/BTC/';
            url_send = 'https://chain.so//api/v2/send_tx/BTC';
            mySymbol = "฿"
            dex.changeType();
        }else if(tabName == "ETH"){
            $("#txtAmount").val('');
            $("#sendAddr").val('');
            $("#Recamount").val('');
            $("#feeSelect").empty();
            $("#feeSelect").append( "<option id='1' value='" + feeETH_high + "'>" + feeETH_high + " /byte (high) </option>" );
            $("#feeSelect").append( "<option id='2' value='" + feeETH_medium + "'>" + feeETH_medium + " /byte (medium) </option>" );
            $("#feeSelect").append( "<option id='3' value='" + feeETH_low + "'>" + feeETH_low + " /byte (low) </option>" );
            feeETH = feeETH_medium;
            $("select#feeSelect").find("option#2").attr("selected", true);

            if(historyETHFlg){
                $("#historyETH").show();
            }else{
                $("#nohistoryETH").show();
            }
            $("#historyLTC").hide();
            $("#nohistoryLTC").hide();
            $("#historyBTC").hide();
            $("#nohistoryBTC").hide();
            fee = feeETH;
            address = addrETH;
            fiatvalue = objCurrency[currency].eth;
            keyPair = keyPairETH;
            myCrypto = 'ETH';
            mySymbol = "E"
            dex.changeType();
        }else{
            $("#send").collapse("hide");
            $("#receive").collapse("hide");
            $("#historyLTC").hide();
            $("#nohistoryLTC").hide();
            $("#historyBTC").hide();
            $("#nohistoryBTC").hide();
            $("#historyETH").hide();
            $("#nohistoryETH").hide();
        }
    }
    function formatMoney(x){
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    function btcFormat(amount){
        var amount = amount.toFixed(8);
        return amount;
    }
    function ethFormat(amount){
        var amount = amount.toFixed(8);
        return amount;
    }
    /**
    function js_AjaxCall(cbfunc) {     // this is the only AJAX call, supply callback   
        jsonString=JSON.stringify(jsonArray);
        $.ajax({
              dataType: 'json',
              method: 'POST',
              url: url_dex,
              data: jsonString,
            })
        .done(function( json ) {
            if(cbfunc == 'js_GetEncryption'){
                if(password.length > 0){
                    // Code for (5)
                    location.replace("#" + json.Documentation.NOW + "!" + passChksum);
                }else{
                    // Code for (6)
                    location.replace("#" + json.Documentation.NOW);
                }
            }else if(cbfunc == 'js_GetDecryption'){
                hash = json.Documentation.NOW;
                $.when(createAddress()).then(
                    getCurrency(),
                    getFeeLTC(),
                    getFeeBTC(),
                    getFeeETH()
                );
            }else if(cbfunc == 'js_GetEncryption2'){
                $.when(createAddress()).then(
                    getCurrency(),
                    getFeeLTC(),
                    getFeeBTC(),
                    getFeeETH()
                );
                if(password.length > 0){
                    // Code for (2)
                    location.replace("#" + json.Documentation.NOW + "!" + passChksum);
                }else{
                    // Code for (3)
                    location.replace("#" + json.Documentation.NOW);
                }
            }else{
                // hundle error
            }
        });
    }
    function js_GetServerInfo(event, data) {
        jsonString = '{"Documentation":{"REQ":"","REP":"","LOG":"","URL":"","TID":"","LAT":"","LNG":"","ALT":""}}';
        jsonArray = JSON.parse ( jsonString );
        switch(event){
            case "LOGIN":
                jsonArray.Documentation.REQ='SERVER';
                jsonArray.Documentation.LOG='*** LOGIN_Litecoin ***';
                break;
            case "SEND":
                jsonArray.Documentation.REQ='SERVER';
                jsonArray.Documentation.LOG='*** SEND_Litecoin ***';
                jsonArray.Documentation.TID= data;
                break;
            case "CREATE":
                jsonArray.Documentation.REQ='SERVER';
                jsonArray.Documentation.LOG='*** CREATE_Litecoin ***';
                break;
            default:
                jsonArray.Documentation.LOG='*** Something else ***';
        }
        js_AjaxCall('js_GotServerInfo');
    }
    function js_GetEncryption(event, data) {
        jsonString = '{"Documentation":{"REQ":"","REP":"","LOG":"","URL":"","TID":"","LAT":"","LNG":"","ALT":""}}';
        jsonArray = JSON.parse ( jsonString );
        switch(event){
            case "ENCRYPT":
                jsonArray.Documentation.REQ='ENCRYPT';
                jsonArray.Documentation.LOG= data;
                js_AjaxCall('js_GetEncryption');
                break;
            case "ENCRYPT2":
                jsonArray.Documentation.REQ='ENCRYPT';
                jsonArray.Documentation.LOG= data;
                js_AjaxCall('js_GetEncryption2');
                break;
            case "DECRYPT":
                jsonArray.Documentation.REQ='DECRYPT';
                jsonArray.Documentation.LOG= data;
                js_AjaxCall('js_GetDecryption');
                break;
            default:
                jsonArray.Documentation.LOG='*** Something else ***';
        }
      }
    **/
    // this function is powered by https://litecoin-project.github.io/p2sh-convert/#
    function convert(address) {
        try {
            decoded = Bitcoin.address.fromBase58Check(address);
            version = decoded['version']
            switch (version) {
                case 5:
                    message = "Mainnet p2sh address: ";
                    version = 50;
                    break;
                case 50:
                    message = "Mainnet p2sh address (deprecated): ";
                    version = 5;
                    break;
                case 196:
                    message = "Testnet p2sh address: ";
                    version = 58;
                    break;
                case 58:
                    message = "Testnet p2sh address (deprecated): ";
                    version = 196;
                    break;
                default:
                    throw "unknown";
            }
            // 5 <-> 50
            // 196 <-> 58
            address = Bitcoin.address.toBase58Check(decoded['hash'], version);
            return address;
        } catch(err) {
                message = "Please enter a valid address.";
                address = "";
                console.log(err);
        }
    }