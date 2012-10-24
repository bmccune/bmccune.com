var _defaultCCGVanityDest = "https://www.chase.com/online/Special-Offers/ccg_redirect.htm%3Fnptag%3DCCG";

function parseQueryString(url)
{
  	if (url.indexOf('?') == -1) 
  	return;

  	query = url.substring(url.indexOf('?')+1);

  	if (query.length < 1) 
  	return;

  	var FORM_DATA = new Object(); 

  	separator = ', '; 

  	keypairs = new Object(); 
  	numKP = 1; 

  	while (query.indexOf('&') > -1) 
  	{
    		keypairs[numKP] = query.substring(0,query.indexOf('&')); 
    		query = query.substring((query.indexOf('&')) + 1); 
    		numKP++; 
  	} 

  	keypairs[numKP] = query;

  	for (i in keypairs) 
  	{ 
    		keyName = keypairs[i].substring(0,keypairs[i].indexOf('='));
    		keyValue = keypairs[i].substring((keypairs[i].indexOf('=')) + 1);
    		while (keyValue.indexOf('+') > -1) 
    		{ 
      			keyValue = keyValue.substring(0,keyValue.indexOf('+')) + ' ' + keyValue.substring(keyValue.indexOf('+') + 1); 
    		} 
    		keyValue = unescape(keyValue);

    		if (FORM_DATA[keyName])
    		{ 
      			FORM_DATA[keyName] = FORM_DATA[keyName] + separator + keyValue;
    		}
    		else
    		{ 
      			FORM_DATA[keyName] = keyValue; 
    		} 
  	}
  	return FORM_DATA; 
} 

function goodUrl(strUrl)
{
  	if (strUrl==undefined) return false;
  	if (strUrl=="") return false;
  	if (strUrl.substr(0,4)!="http") return false;
  	return true;
}

function saveVanityRedirectCookie(domain)
{
	var arParams = parseQueryString(location.href);
	var strDest = "";
	var strSig = "";
	
	try
	{
		strDest = arParams["dest"];
		if(strDest != "undefined" && strDest != null)
		{
			strSig = arParams["sig"];
			strDest = _defaultCCGVanityDest + "&DEST=" + strDest + "&sig=" + strSig; 
	    }
	}
  	catch(err)
	{
		strDest = "";
	}
	strDest = goodUrl(strDest)?strDest:_defaultCCGVanityDest;
	
	if (strDest.indexOf("DEST=") == -1) 
	     return;
	var destVal = strDest.substring(strDest.indexOf("DEST=")+5, strDest.length);	 
	if ((destVal.indexOf("?") == -1) && (destVal.indexOf("%3F") == -1))
	{
	     if (destVal.indexOf("&sig"))
	     {
	        var destFinal = destVal.replace("&sig","?sig");
	        document.cookie = "preredirect="+destFinal+"; ; path=/; domain="+domain;
	     }
		     
	}
	else
	{
	     document.cookie = "preredirect="+destVal+"; ; path=/; domain="+domain;	
	} 

}