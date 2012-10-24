function bolOffSiteLink(gotoName,gotoURL){  
	// modified by James Gulick -- 7/15/2005
	gotoName = escape(gotoName);
	gotoURL = escape(gotoURL); 
	var OffSitePopUpURL;
	var leftOffset=0;
	var topOffset=0;    
	//OffSitePopUpURL="weblinking_popup.htm?"; 
	OffSitePopUpURL="nextstep.html?&";
	if(screen.width){
		if(screen.width < 800){
			leftOffset=60;
			topOffset=90;
		}else{
			if(screen.width>=800&&screen.width<1024){
				leftOffset=160;
				topOffset=134;
			}else{
				if(screen.width>=1024){
					leftOffset=272;
					topOffset=250;
				}
			}
		}
	}
	var loadURL="nextstep.html?&site=Facebook&url=https%3A//www.facebook.com/ChaseCommunityGiving/app_349872001764046"
	var webLinkWin=window.open(loadURL,"weblinking",'width=550,height=375,left='+leftOffset+',top='+topOffset+',screenx='+leftOffset+',screeny='+topOffset+',resizable=no,scrollbars=yes,menubar=no');
	webLinkWin.focus();
}