export function applyCoupon({subtotalCents,couponCode,couponExpiresAt,now}:{subtotalCents:number;couponCode:string;couponExpiresAt:string;now:string}) {
 if(!Number.isSafeInteger(subtotalCents)||subtotalCents<0)throw new Error('INVALID_AMOUNT');
 const utc=/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
 if(!utc.test(couponExpiresAt)||!utc.test(now)||!Number.isFinite(Date.parse(couponExpiresAt))||!Number.isFinite(Date.parse(now))||new Date(couponExpiresAt).toISOString()!==couponExpiresAt||new Date(now).toISOString()!==now)throw new Error('INVALID_TIME');
 if(Date.parse(now) >= Date.parse(couponExpiresAt))return {code:'EXPIRED_COUPON',totalCents:subtotalCents};
 if(couponCode!=='SAVE100')return {code:'INVALID_COUPON',totalCents:subtotalCents};
 return {code:'APPLIED',totalCents:Math.max(0,subtotalCents-100)};
}
