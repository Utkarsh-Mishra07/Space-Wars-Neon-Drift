const {test,expect}=require('@playwright/test');
test('published game loads its assets and starts the campaign',async({page,request})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400) errors.push(`${r.status()} ${r.url()}`)});
 page.on('requestfailed',r=>errors.push(r.url()));
 await page.goto('./');
 await page.locator('#start').click();
 await expect(page.locator('#overlay')).toBeHidden();
 await expect(page.locator('#sector')).toHaveText('SECTOR 01');
 await page.locator('#pause').click();await expect(page.locator('#resume')).toBeVisible();
 const response=await request.get('./version.json');expect(response.ok()).toBe(true);
 const version=await response.json();if(process.env.EXPECTED_COMMIT)expect(version.commit).toBe(process.env.EXPECTED_COMMIT);
 expect(errors).toEqual([]);
});
