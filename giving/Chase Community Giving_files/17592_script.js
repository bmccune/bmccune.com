$(function () {
		
		var ie = window.navigator.userAgent.indexOf('MSIE');

		$("#openRules").click( function () {
			if (ie == -1){
				if ( window.matchMedia("(max-width: 720px)").matches ) {
					window.open('https://www.chase.com/online/Special-Offers/chasegiving_rules.htm');
				} else {
					$("#screenOverlay").show();
					$("#modalContainer").show();
					$("#closeContainer a").focus();
				}
			} else {
				$("#screenOverlay").show();
				$("#modalContainer").show();
				$("#closeContainer a").focus();
			}

		});
		
		$("#closeContainer a").click( function () {
			$("#screenOverlay").hide();
			$("#modalContainer").hide();
			$("#openRules").focus();
		});

});