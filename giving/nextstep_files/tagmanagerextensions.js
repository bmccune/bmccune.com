CHASE.TagManager.xpoActivity=function(E,B,G,D,C){var A={xpo:{}};
if(D&&D!=null){A.xpo.productId=D
}if(B&&B!=null){A.xpo.AppID=B
}if(G&&G!=null){A.xpo.TagMap=G
}if(E&&E!=null){A.xpo.OrgID=E
}if(C&&C!=null){A.xpo.sourceCode=C
}var D=D||"{xpo.productId}";
var C=C||"";
var F="stg";
if(CHASE.TagManager.clientVars.env=="prod"){F="s"
}var H="https://"+F+".xp1.ru4.com/meta?_o={xpo.OrgID}";
H=H+"&_t={xpo.AppID}";
H=H+"&ssv_tmc={xpo.TagMap}";
H=H+"&ssv_v1st={v1st}";
H=H+"&ssv_pfid={persona.pfid}";
H=H+"&ssv_productid={xpo.productId}";
H=H+"&ssv_src={xpo.sourceCode}";
H=H+"&_eid={xpo.TagMap}_{xpo.productId}_{xpo.sourceCode}";
CHASE.TagManager.invokePixelTag(H,A)
};
CHASE.TagManager.bluekai=function(){var A={bluekai:{}};
var C="https://stags.bluekai.com/site/5473?limit=4&ret=html&";
C=C+"phint=v1st%3D{v1st}";
C=C+"&phint=profileID%3D{persona.pfid}";
C=CHASE.TagManager.replacePlaceholder(C,A);
var B=document.createElement("iframe");
B.style.display="none";
B.src=C;
document.body.appendChild(B)
};
CHASE.TagManager.ExtensionsLoaded=true;