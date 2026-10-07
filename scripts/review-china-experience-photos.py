"""Download a finite editorial shortlist and make a local review contact sheet."""
import json, pathlib, requests
from PIL import Image, ImageOps, ImageDraw
ROOT=pathlib.Path(__file__).resolve().parent.parent
OUT=ROOT/'artifacts/china-enrichment-photo-review'
SHORTLIST={
 'guangzhou-canton-enamel':('广彩人物纹大碗.jpg','related-theme','广彩人物纹大碗实物照片，展示彩绘风格；不是体验工坊现场。'),
 'harbin-yabuli-ski':('Yabuli Ski Resort.jpg','exact-place','亚布力雪场实景；雪道开放与课程场地按当日安排。'),
 'harbin-songhua-ferry':('Harbin Scenes 哈爾濱景色 (1792349602).jpg','nearby','斯大林公园旁松花江江岸与渡船通道实景；非当前船型或班次照片。'),
 'harbin-forest-botany':('Heilongjiang Forest Botanical Garden 2015-05-16-02.jpg','exact-place','黑龙江省森林植物园实景；植物物候随季节变化。'),
 'harbin-beer-culture':('Harbin beer (8372465263).jpg','related-theme','哈尔滨啤酒产品实拍，介绍品牌文化；不是博物馆内部照片。'),
 'lijiang-lashi-birds':('拉市海 02.jpg','exact-place','拉市海湿地实景，展示观鸟环境；不能保证遇见特定鸟种。'),
 'lijiang-baisha-tie-dye':('Dali, Yunnan Province, China - 2560935842.jpg','related-theme','拍摄于大理的云南扎染工艺，用于认识技法与织物；不是白沙预约工坊现场。'),
 'nanjing-qinhuai-boat':('Bötchen in Nanjing (6923006076).jpg','nearby','南京水巷游船实拍，用于了解乘船氛围；不能据此确定具体航线或船型。'),
 'nanjing-woodblock-printing':('Kejingchu in Nanjing 2012-02.JPG','exact-place','金陵刻经处入口实景；手作活动须另行确认日期。'),
 'sanya-serenity-sailing':('Afterglow at Sanya Banshan Peninsula Sailboat Port.jpg','exact-place','三亚半山半岛帆船港实景；实际出海船型按运营方确认。'),
 'suzhou-kunqu-evening':('Pekinguniversitykunqu1.jpg','related-theme','北京大学舞台上的昆曲演出实拍，用于认识戏曲表演；不是苏州所选当晚节目。'),
 'lijiang-baisha':('20240503 Baisha.jpg','exact-place','丽江白沙古镇街巷实景。'),
}
def main():
 data=json.loads((ROOT/'artifacts/china-experience-photo-research.json').read_text(encoding='utf8'))
 allphotos={p['title'].removeprefix('File:'):p for v in data.values() for p in v['candidates']}
 OUT.mkdir(parents=True,exist_ok=True)
 rows=[]
 session=requests.Session();session.headers['User-Agent']='TusuanTravelPhotoReview/1.0 (+https://github.com/ducky-yyds/tour-fee)'
 for key,(title,scope,note) in SHORTLIST.items():
  p=allphotos[title]; dest=OUT/(key+'.jpg')
  if not dest.exists():
   response=session.get(p['thumburl'],timeout=35);response.raise_for_status();dest.write_bytes(response.content)
  with Image.open(dest) as im:
   im.verify()
  rows.append({'id':key,'title':title,'scope':scope,'note':note,'photo':p,'local':str(dest)})
 (OUT/'shortlist.json').write_text(json.dumps(rows,ensure_ascii=False,indent=2)+'\n',encoding='utf8')
 sheet=Image.new('RGB',(960,240*((len(rows)+2)//3)),'white');draw=ImageDraw.Draw(sheet)
 for i,row in enumerate(rows):
  x=i%3*320;y=i//3*240
  with Image.open(row['local']) as im:sheet.paste(ImageOps.contain(im.convert('RGB'),(310,200)),(x,y))
  draw.text((x+3,y+203),str(i+1)+' '+row['id'],fill='black')
 sheet.save(OUT/'contact.jpg')
 print(len(rows),OUT/'contact.jpg')
if __name__=='__main__':main()
