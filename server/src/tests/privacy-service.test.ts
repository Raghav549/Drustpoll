import assert from 'node:assert/strict';
import test from 'node:test';

const valid=(x:{profileVisibility:string;activityVisibility:string;discoverability:string;messageRequests:string})=>['public','followers','private'].includes(x.profileVisibility)&&['everyone','followers','only_me'].includes(x.activityVisibility)&&['discoverable','hidden'].includes(x.discoverability)&&['everyone','followers','nobody'].includes(x.messageRequests);

test('privacy contract accepts only bounded choices',()=>{assert.equal(valid({profileVisibility:'public',activityVisibility:'followers',discoverability:'discoverable',messageRequests:'followers'}),true);assert.equal(valid({profileVisibility:'open',activityVisibility:'followers',discoverability:'discoverable',messageRequests:'followers'}),false);});
