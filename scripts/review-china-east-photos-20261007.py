"""Make diagnostic contact sheets for a finite, subject-matched photo shortlist."""
import json, pathlib, sys, time
import requests
from PIL import Image, ImageOps, ImageDraw
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'artifacts/china-east-20261007/review'
SHORTLIST={
 'food-huangshan-hairy-tofu':('方鑫玉毛豆腐 2.jpg','毛豆腐菜品实拍，具体门店的做法和摆盘可能不同。'),
 'food-fuzhou-rouyan':('Rouyan.jpg','福建连江丹阳肉燕实拍，用于介绍福州地区的肉燕食品；各店盛器与份量不同。'),
 'food-fuzhou-lizhi-pork':('Litchi Pork.jpg','福州荔枝肉实拍，用于认识菜品外观。'),
 'food-fuzhou-buddha':('Buddha soup2.jpg','拍摄于台北的佛跳墙实物照片；不同地区、店家和价位的配料不同。'),
 'food-fuzhou-dingbian':('Diāng-biĕng-gù.JPG','福州三坊七巷鼎边糊实拍。'),
 'food-wuyishan-tea-eggs':('Tea flavored egg.jpg','茶叶蛋实物照片；不能从照片判断是否采用大红袍茶叶。'),
 'food-jingdezhen-rice-steam':('粉蒸肉.jpg','粉蒸肉菜品照片；景德镇各店配料与盛器可能不同。'),
 'food-yangzhou-sanding':('Fu Chun Tea House buns.JPG','扬州富春茶社茶点实拍，包含三丁包、千层油糕与翡翠烧卖。'),
 'food-yangzhou-jade-shaomai':('Fu Chun Tea House buns.JPG','扬州富春茶社茶点实拍，包含三丁包、千层油糕与翡翠烧卖。'),
 'food-yangzhou-gansi':('Braised Shredded Chicken with Ham and Dried Tofu 2011-04.JPG','扬州淮扬菜博物馆的大煮干丝展示照片，用于认识菜式。'),
 'food-shaoxing-preserved-pork':('Steamed Sliced Pork Belly with Preserved Vegetable in Meizhou (20200928174231).jpg','梅州拍摄的梅干菜扣肉实物；不同地区调味、切片与摆盘会不同。'),
 'food-shaoxing-stinky-tofu':('Stinky Tofu Wuzhen.jpg','乌镇餐馆的炸臭豆腐实物，呈现江南炸豆腐风格；绍兴店家的卤水与蘸料不同。'),
 'food-chaozhou-beef-balls':('Beefball closeup.jpg','牛肉丸实物照片，具体店家的制作方式与份量需看菜单。'),
 'food-chaozhou-oyster':('Oyster omelette.jpg','潮州菜蚝烙实物照片，非台式淋甜酱蚵仔煎。'),
 'food-chaozhou-sweet-taro':('Fansawoo.jpg','潮州菜反沙芋头实物照片。'),
 'food-chaozhou-peach-kueh':('Red peach cake.jpg','马来西亚潮州社群的红桃粿实物；地域与门店馅料可能不同。'),
 'food-macau-minchi':('Minchi.jpg','澳门免治菜品实拍。'),
 'food-macau-african-chicken':('African chicken macau.JPG','澳门餐馆的非洲鸡菜品实拍。'),
 'food-macau-pork-bun':('PorkChopBun.jpg','澳门氹仔大利来记猪扒包实拍。'),
 'food-leshan-bobo':('Red Oil Bobo-Chicken.jpg','红油钵钵鸡实物照片，具体食材与辣度按店家选择。'),
 'food-leshan-qiaojiao':('Qiaojiao Beef at Li Si Niang Restaurant, Beijing (20211019184013).jpg','北京餐馆的跷脚牛肉实物照片，用于介绍同名乐山菜式，非苏稽店面照片。'),
 'food-leshan-tofu-pudding':('乐山豆腐脑.jpg','乐山咸味豆腐脑菜品实拍。'),
 'food-guiyang-siwawa':('丝娃娃 (28664736712).jpg','贵州贵阳丝娃娃实拍。'),
}
def main():
    if hasattr(sys.stdout,'reconfigure'):sys.stdout.reconfigure(encoding='utf-8')
    data=json.loads((OUT.parent/'photo-candidates.json').read_text(encoding='utf-8'))
    OUT.mkdir(parents=True,exist_ok=True)
    session=requests.Session();session.headers['User-Agent']='TusuanTravelPhotoReview/1.0 (+https://github.com/ducky-yyds/tour-fee)'
    rows=[]
    for key,(title,note) in SHORTLIST.items():
        photos=data.get(key,{}).get('candidates',[])
        photo=next((p for p in photos if p['photoFile']==title),None)
        if not photo:print('missing candidate',key,flush=True);continue
        dest=OUT/(key+'.jpg')
        if not dest.exists():
            time.sleep(.8)
            response=session.get(photo['remoteUrl'],timeout=35)
            if response.status_code==429:print('CDN rate limit: stopped',flush=True);break
            if response.status_code!=200:print('download failed',key,response.status_code,flush=True);continue
            dest.write_bytes(response.content)
        try:
            with Image.open(dest) as im:im.verify()
        except Exception as err:print('invalid image',key,str(err),flush=True);continue
        rows.append({'id':key,'title':title,'scope':'exact-place','note':note,'photo':photo,'local':str(dest)})
    (OUT/'shortlist.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    for start in range(0,len(rows),12):
        subset=rows[start:start+12];sheet=Image.new('RGB',(1200,260*((len(subset)+3)//4)),'white');draw=ImageDraw.Draw(sheet)
        for i,row in enumerate(subset):
            x=i%4*300;y=i//4*260
            with Image.open(row['local']) as im:sheet.paste(ImageOps.contain(im.convert('RGB'),(290,215)),(x,y))
            draw.text((x+3,y+220),str(start+i+1)+' '+row['id'].removeprefix('food-'),fill='black')
        sheet.save(OUT/f'contact-{start//12+1}.jpg')
    print('candidates for visual review',len(rows),flush=True)
if __name__=='__main__':main()
