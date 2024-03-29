// ==UserScript==
// @name         ParkPostPilot
// @name:zh      留园发帖小助手
// @name:zh-CN   留园发帖小助手
// @name:zh-HK   留園發帖小助手
// @name:zh-SG   留园发帖小助手
// @name:zh-TW   留園發帖小助手
// @namespace    https://github.com/cbayl/ParkPostPilot
// @version      0.12
// @description  This tool makes posting on 6park forums more convenient, simple, and aesthetically pleasing.
// @description:zh  此工具可以讓妳在留園的發帖更加方便簡單好看。
// @description:zh-CN  此工具可以让你在留园的发帖更加方便简单好看。
// @description:zh-HK  此工具可以讓妳在留園的發帖更加方便簡單好看。
// @description:zh-SG  此工具可以让你在留园的发帖更加方便简单好看。
// @description:zh-TW  此工具可以讓妳在留園的發帖更加方便簡單好看。
// @author       lyabcv@gmail.com
// @license      MIT
// @match        https://web.6parkbbs.com/index.php?app=forum&act=post&bbsid*
// @match        https://club.6parkbbs.com/*/index.php?app=forum&act=postnew*
// @match        https://club.6parkbbs.com/*/index.php?app=forum&act=postnew*
// @match        https://www.cool18.com/site/index.php?app=forum&act=post&bbsid*
// @match        https://www.cool18.com/*/index.php?app=forum&act=postnew&fid=1
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_addStyle
// @downloadURL  https://github.com/cbayl/parkpostpilot/raw/main/main.user.js
// @updateURL    https://github.com/cbayl/parkpostpilot/raw/main/main.user.js

// ==/UserScript==

(function() {
    'use strict';
    console.log("留园发帖小助手")

    const TITLE_LENGTH=60;
    const REPLACE_LINE_WITH_BR=false;
    const REPLACE_FILTERED_TAG=true;
    const AUTO_SUBMIT=false;
    const CONVERT_TO_SIMPLIZED_CHINESE =true;
    const IF_ADD_TITLE_PREFIX = true;
    const IF_CHECK_UNCLOSED_TAG = false;//检查是否有未关闭的<>
    const IF_BEAUTIFY_CODE = true;//对帖子进行美化
    const USER_DEFINED_POST_TYPE_SETTINGS = [
        ["【新闻】", "", "", "", "新闻"],
        ["【软件】", "", "", "", "软件"],
        ["", "img", "lyabc", "", "图文"],
        ["【教程】", "", "lyabc", "编程技术", "教程"],
        // 可以添加更多规则
        // 第一项是标题内关键字
        // 第二项是内容关键字
        // 第三项是用户名
        // 第四项是论坛名
        // 第五项是帖子类型
    ];
    const USER_DEFINED_TITLE_PREFIX_SETTINGS = [
        ["电脑", "", "lyabc", "电脑前线", "💻"],
        ["[求助]", "", "lyabc", "电脑前线", "🙋‍♂️"],
        ["【分享】", "", "lyabc", "电脑前线", "🔁"],
        ["【讨论】", "", "lyabc", "电脑前线", "💬"],
        // 可以添加更多规则
        // 第一项是标题内关键字
        // 第二项是内容关键字
        // 第三项是用户名
        // 第四项是论坛名
        // 第五项prefix,可以是emoji,也可以是其它的内容
    ];
    //     // 从本地存储加载用户自定义规则，如果没有则使用默认规则
    //     const defaultUserDefinedPostTypeSettings = GM_getValue('userDefinedPostTypeSettings', USER_DEFINED_POST_TYPE_SETTINGS);
    //     // 在脚本更新时保存用户自定义规则
    //     GM_setValue('userDefinedPostTypeSettings', defaultUserDefinedPostTypeSettings);

    //     // 在这之后，你可以使用 USER_DEFINED_POST_TYPE_SETTINGS 来访问用户自定义规则
    //     console.log(USER_DEFINED_POST_TYPE_SETTINGS);

    function determinePostType(title, content, username, forumName) {

        for (const rule of USER_DEFINED_POST_TYPE_SETTINGS) {
            const [titleKeyword, contentKeyword, usernameKeyword, forumNameKeyword, postType] = rule;

            if (
                (titleKeyword === "" || title.includes(titleKeyword)) &&
                (contentKeyword === "" || content.includes(contentKeyword)) &&
                (usernameKeyword === "" || username === usernameKeyword) &&
                (forumNameKeyword === "" || forumName === forumNameKeyword)
            ) {
                return postType;
            }
        }
        return "-";// 默认类型，可以根据需求修改
    }
    function determineTitlePrefix(title, content, username, forumName) {

        for (const rule of USER_DEFINED_TITLE_PREFIX_SETTINGS) {
            const [titleKeyword, contentKeyword, usernameKeyword, forumNameKeyword, titlePrefix] = rule;

            if (
                (titleKeyword === "" || title.includes(titleKeyword)) &&
                (contentKeyword === "" || content.includes(contentKeyword)) &&
                (usernameKeyword === "" || username === usernameKeyword) &&
                (forumNameKeyword === "" || forumName === forumNameKeyword)
            ) {
                return titlePrefix;
            }
        }
        return "";// 默认类型，可以根据需求修改
    }

    // 获取TextArea内容
    function getTextAreaContent() {
        //获得填写的内容
        const contentTextArea = document.querySelector('textarea[name="content"]');
        const textAreaContent = contentTextArea.value;
        return textAreaContent

    }
    // 获取Subject内容
    function getSubjectContent() {
        //获得填写的内容
        const contentSubject = document.querySelector("#subject");
        const textSubject= contentSubject.value;
        return textSubject

    }
    // 获取Type内容
    function getTypeContent() {
        //获得填写的内容
        const typeElement = document.querySelector("#myform > table > tbody > tr:nth-child(2) > td > select");
        const textType= typeElement.value;
        return textType
    }

    // Function to convert HTML code in the post
    function convertHTMLCode(content) {
        // Split the content into lines
        const lines = content.split('\n');
        // Process each line
        const processedLines = lines.map(line => {
            // Check if the line is HTML code
            if (!isHTMLCode(line)) {
                // Check for YouTube links and convert
                if (line.startsWith("https://www.youtu")||line.startsWith("https://youtu.be")||line.startsWith("https://youtube.com")) {
                    line = convertYouTubeLinks(line);
                }
                // Check for Sendvidlinks and convert
                else if (line.startsWith("https://sendvid")) {
                    line = convertSendvidLinks(line);
                }
                // Check for image links and convert
                else if (isImage(line)) {
                    line = convertImageLinks(line);
                }
                // Check for UBB code and convert
                else if (line.includes("[b]") || line.includes("[/b]")) {
                    line = convertUBBCode(line);
                }
            }

            return line;
        });

        // Join the processed lines back into content
        const processedContent = processedLines.join('\n');
        return processedContent;
    }
    //Function to check if a line is Image URL
    function isImage(url) {
        return /^https?:\/\/.+\.(jpg|jpeg|png|webp|avif|gif|svg)$/.test(url);
    }

    // Function to check if a line is HTML code
    function isHTMLCode(line) {
        return /<\/?[a-z][\s\S]*>/i.test(line);
    }

    // Function to convert YouTube links to embedded codes
    function convertYouTubeLinks(line) {
        var regExp =/^.*(?:(?:youtu\.be\/|v\/|vi\/|u\/\w\/|embed\/|shorts\/)|(?:(?:watch)?\?v(?:i)?=|\&v(?:i)?=))([^#\&\?]*).*/;
        var match = line.match(regExp);

        if(match&&match[1].length==11){
            var videoId = match[1];
            return `<embed src="https://www.youtube.com/v/${videoId} "type="application/x-shockwave-flash" width="480" height="320" allowfullscreen="true" style="margin:2px;">`;
        }

        return line;
    }

    // Function to convert Sendvid links to embedded codes
    function convertSendvidLinks(line) {
        const regex = /(https?:\/\/)?(www\.)?sendvid\.com\/([a-zA-Z0-9]+)/;
        const match = line.match(regex);

        if (match) {
            const videoId = match[3];
            const embedCode = `<embed src="//sendvid.com/embed/${videoId}" name="plugin" width="480" height="320" allowfullscreen="true" style="margin:2px;">`;
            return line.replace(regex, embedCode);
        }

        return line;
    }

    function JTPYStr()
    {
        return '万与丑专业丛东丝丢两严丧个丬丰临为丽举么义乌乐乔习乡书买乱争于亏云亘亚产亩亲亵亸亿仅从仑仓仪们价众优伙会伛伞伟传伤伥伦伧伪伫体余佣佥侠侣侥侦侧侨侩侪侬俣俦俨俩俪俭债倾偬偻偾偿傥傧储傩儿兑兖党兰关兴兹养兽冁内冈册写军农冢冯冲决况冻净凄凉凌减凑凛几凤凫凭凯击凼凿刍划刘则刚创删别刬刭刽刿剀剂剐剑剥剧劝办务劢动励劲劳势勋勐勚匀匦匮区医华协单卖卢卤卧卫却卺厂厅历厉压厌厍厕厢厣厦厨厩厮县参叆叇双发变叙叠叶号叹叽吁后吓吕吗吣吨听启吴呒呓呕呖呗员呙呛呜咏咔咙咛咝咤咴咸哌响哑哒哓哔哕哗哙哜哝哟唛唝唠唡唢唣唤唿啧啬啭啮啰啴啸喷喽喾嗫呵嗳嘘嘤嘱噜噼嚣嚯团园囱围囵国图圆圣圹场坂坏块坚坛坜坝坞坟坠垄垅垆垒垦垧垩垫垭垯垱垲垴埘埙埚埝埯堑堕塆墙壮声壳壶壸处备复够头夸夹夺奁奂奋奖奥妆妇妈妩妪妫姗姜娄娅娆娇娈娱娲娴婳婴婵婶媪嫒嫔嫱嬷孙学孪宁宝实宠审宪宫宽宾寝对寻导寿将尔尘尧尴尸尽层屃屉届属屡屦屿岁岂岖岗岘岙岚岛岭岳岽岿峃峄峡峣峤峥峦崂崃崄崭嵘嵚嵛嵝嵴巅巩巯币帅师帏帐帘帜带帧帮帱帻帼幂幞干并广庄庆庐庑库应庙庞废庼廪开异弃张弥弪弯弹强归当录彟彦彻径徕御忆忏忧忾怀态怂怃怄怅怆怜总怼怿恋恳恶恸恹恺恻恼恽悦悫悬悭悯惊惧惨惩惫惬惭惮惯愍愠愤愦愿慑慭憷懑懒懔戆戋戏戗战戬户扎扑扦执扩扪扫扬扰抚抛抟抠抡抢护报担拟拢拣拥拦拧拨择挂挚挛挜挝挞挟挠挡挢挣挤挥挦捞损捡换捣据捻掳掴掷掸掺掼揸揽揿搀搁搂搅携摄摅摆摇摈摊撄撑撵撷撸撺擞攒敌敛数斋斓斗斩断无旧时旷旸昙昼昽显晋晒晓晔晕晖暂暧札术朴机杀杂权条来杨杩杰极构枞枢枣枥枧枨枪枫枭柜柠柽栀栅标栈栉栊栋栌栎栏树栖样栾桊桠桡桢档桤桥桦桧桨桩梦梼梾检棂椁椟椠椤椭楼榄榇榈榉槚槛槟槠横樯樱橥橱橹橼檐檩欢欤欧歼殁殇残殒殓殚殡殴毁毂毕毙毡毵氇气氢氩氲汇汉污汤汹沓沟没沣沤沥沦沧沨沩沪沵泞泪泶泷泸泺泻泼泽泾洁洒洼浃浅浆浇浈浉浊测浍济浏浐浑浒浓浔浕涂涌涛涝涞涟涠涡涢涣涤润涧涨涩淀渊渌渍渎渐渑渔渖渗温游湾湿溃溅溆溇滗滚滞滟滠满滢滤滥滦滨滩滪漤潆潇潋潍潜潴澜濑濒灏灭灯灵灾灿炀炉炖炜炝点炼炽烁烂烃烛烟烦烧烨烩烫烬热焕焖焘煅煳熘爱爷牍牦牵牺犊犟状犷犸犹狈狍狝狞独狭狮狯狰狱狲猃猎猕猡猪猫猬献獭玑玙玚玛玮环现玱玺珉珏珐珑珰珲琎琏琐琼瑶瑷璇璎瓒瓮瓯电画畅畲畴疖疗疟疠疡疬疮疯疱疴痈痉痒痖痨痪痫痴瘅瘆瘗瘘瘪瘫瘾瘿癞癣癫癯皑皱皲盏盐监盖盗盘眍眦眬着睁睐睑瞒瞩矫矶矾矿砀码砖砗砚砜砺砻砾础硁硅硕硖硗硙硚确硷碍碛碜碱碹磙礼祎祢祯祷祸禀禄禅离秃秆种积称秽秾稆税稣稳穑穷窃窍窑窜窝窥窦窭竖竞笃笋笔笕笺笼笾筑筚筛筜筝筹签简箓箦箧箨箩箪箫篑篓篮篱簖籁籴类籼粜粝粤粪粮糁糇紧絷纟纠纡红纣纤纥约级纨纩纪纫纬纭纮纯纰纱纲纳纴纵纶纷纸纹纺纻纼纽纾线绀绁绂练组绅细织终绉绊绋绌绍绎经绐绑绒结绔绕绖绗绘给绚绛络绝绞统绠绡绢绣绤绥绦继绨绩绪绫绬续绮绯绰绱绲绳维绵绶绷绸绹绺绻综绽绾绿缀缁缂缃缄缅缆缇缈缉缊缋缌缍缎缏缐缑缒缓缔缕编缗缘缙缚缛缜缝缞缟缠缡缢缣缤缥缦缧缨缩缪缫缬缭缮缯缰缱缲缳缴缵罂网罗罚罢罴羁羟羡翘翙翚耢耧耸耻聂聋职聍联聩聪肃肠肤肷肾肿胀胁胆胜胧胨胪胫胶脉脍脏脐脑脓脔脚脱脶脸腊腌腘腭腻腼腽腾膑臜舆舣舰舱舻艰艳艹艺节芈芗芜芦苁苇苈苋苌苍苎苏苘苹茎茏茑茔茕茧荆荐荙荚荛荜荞荟荠荡荣荤荥荦荧荨荩荪荫荬荭荮药莅莜莱莲莳莴莶获莸莹莺莼萚萝萤营萦萧萨葱蒇蒉蒋蒌蓝蓟蓠蓣蓥蓦蔷蔹蔺蔼蕲蕴薮藁藓虏虑虚虫虬虮虽虾虿蚀蚁蚂蚕蚝蚬蛊蛎蛏蛮蛰蛱蛲蛳蛴蜕蜗蜡蝇蝈蝉蝎蝼蝾螀螨蟏衅衔补衬衮袄袅袆袜袭袯装裆裈裢裣裤裥褛褴襁襕见观觃规觅视觇览觉觊觋觌觍觎觏觐觑觞触觯詟誉誊讠计订讣认讥讦讧讨让讪讫训议讯记讱讲讳讴讵讶讷许讹论讻讼讽设访诀证诂诃评诅识诇诈诉诊诋诌词诎诏诐译诒诓诔试诖诗诘诙诚诛诜话诞诟诠诡询诣诤该详诧诨诩诪诫诬语诮误诰诱诲诳说诵诶请诸诹诺读诼诽课诿谀谁谂调谄谅谆谇谈谊谋谌谍谎谏谐谑谒谓谔谕谖谗谘谙谚谛谜谝谞谟谠谡谢谣谤谥谦谧谨谩谪谫谬谭谮谯谰谱谲谳谴谵谶谷豮贝贞负贠贡财责贤败账货质贩贪贫贬购贮贯贰贱贲贳贴贵贶贷贸费贺贻贼贽贾贿赀赁赂赃资赅赆赇赈赉赊赋赌赍赎赏赐赑赒赓赔赕赖赗赘赙赚赛赜赝赞赟赠赡赢赣赪赵赶趋趱趸跃跄跖跞践跶跷跸跹跻踊踌踪踬踯蹑蹒蹰蹿躏躜躯车轧轨轩轪轫转轭轮软轰轱轲轳轴轵轶轷轸轹轺轻轼载轾轿辀辁辂较辄辅辆辇辈辉辊辋辌辍辎辏辐辑辒输辔辕辖辗辘辙辚辞辩辫边辽达迁过迈运还这进远违连迟迩迳迹适选逊递逦逻遗遥邓邝邬邮邹邺邻郁郄郏郐郑郓郦郧郸酝酦酱酽酾酿释里鉅鉴銮錾钆钇针钉钊钋钌钍钎钏钐钑钒钓钔钕钖钗钘钙钚钛钝钞钟钠钡钢钣钤钥钦钧钨钩钪钫钬钭钮钯钰钱钲钳钴钵钶钷钸钹钺钻钼钽钾钿铀铁铂铃铄铅铆铈铉铊铋铍铎铏铐铑铒铕铗铘铙铚铛铜铝铞铟铠铡铢铣铤铥铦铧铨铪铫铬铭铮铯铰铱铲铳铴铵银铷铸铹铺铻铼铽链铿销锁锂锃锄锅锆锇锈锉锊锋锌锍锎锏锐锑锒锓锔锕锖锗错锚锜锞锟锠锡锢锣锤锥锦锨锩锫锬锭键锯锰锱锲锳锴锵锶锷锸锹锺锻锼锽锾锿镀镁镂镃镆镇镈镉镊镌镍镎镏镐镑镒镕镖镗镙镚镛镜镝镞镟镠镡镢镣镤镥镦镧镨镩镪镫镬镭镮镯镰镱镲镳镴镶长门闩闪闫闬闭问闯闰闱闲闳间闵闶闷闸闹闺闻闼闽闾闿阀阁阂阃阄阅阆阇阈阉阊阋阌阍阎阏阐阑阒阓阔阕阖阗阘阙阚阛队阳阴阵阶际陆陇陈陉陕陧陨险随隐隶隽难雏雠雳雾霁霉霭靓静靥鞑鞒鞯鞴韦韧韨韩韪韫韬韵页顶顷顸项顺须顼顽顾顿颀颁颂颃预颅领颇颈颉颊颋颌颍颎颏颐频颒颓颔颕颖颗题颙颚颛颜额颞颟颠颡颢颣颤颥颦颧风飏飐飑飒飓飔飕飖飗飘飙飚飞飨餍饤饥饦饧饨饩饪饫饬饭饮饯饰饱饲饳饴饵饶饷饸饹饺饻饼饽饾饿馀馁馂馃馄馅馆馇馈馉馊馋馌馍馎馏馐馑馒馓馔馕马驭驮驯驰驱驲驳驴驵驶驷驸驹驺驻驼驽驾驿骀骁骂骃骄骅骆骇骈骉骊骋验骍骎骏骐骑骒骓骔骕骖骗骘骙骚骛骜骝骞骟骠骡骢骣骤骥骦骧髅髋髌鬓魇魉鱼鱽鱾鱿鲀鲁鲂鲄鲅鲆鲇鲈鲉鲊鲋鲌鲍鲎鲏鲐鲑鲒鲓鲔鲕鲖鲗鲘鲙鲚鲛鲜鲝鲞鲟鲠鲡鲢鲣鲤鲥鲦鲧鲨鲩鲪鲫鲬鲭鲮鲯鲰鲱鲲鲳鲴鲵鲶鲷鲸鲹鲺鲻鲼鲽鲾鲿鳀鳁鳂鳃鳄鳅鳆鳇鳈鳉鳊鳋鳌鳍鳎鳏鳐鳑鳒鳓鳔鳕鳖鳗鳘鳙鳛鳜鳝鳞鳟鳠鳡鳢鳣鸟鸠鸡鸢鸣鸤鸥鸦鸧鸨鸩鸪鸫鸬鸭鸮鸯鸰鸱鸲鸳鸴鸵鸶鸷鸸鸹鸺鸻鸼鸽鸾鸿鹀鹁鹂鹃鹄鹅鹆鹇鹈鹉鹊鹋鹌鹍鹎鹏鹐鹑鹒鹓鹔鹕鹖鹗鹘鹚鹛鹜鹝鹞鹟鹠鹡鹢鹣鹤鹥鹦鹧鹨鹩鹪鹫鹬鹭鹯鹰鹱鹲鹳鹴鹾麦麸黄黉黡黩黪黾鼋鼌鼍鼗鼹齄齐齑齿龀龁龂龃龄龅龆龇龈龉龊龋龌龙龚龛龟志制咨只里系范松没尝尝闹面准钟别闲干尽脏';
    }
    function FTPYStr()
    {
        return '萬與醜專業叢東絲丟兩嚴喪個爿豐臨為麗舉麼義烏樂喬習鄉書買亂爭於虧雲亙亞產畝親褻嚲億僅從侖倉儀們價眾優夥會傴傘偉傳傷倀倫傖偽佇體餘傭僉俠侶僥偵側僑儈儕儂俁儔儼倆儷儉債傾傯僂僨償儻儐儲儺兒兌兗黨蘭關興茲養獸囅內岡冊寫軍農塚馮衝決況凍淨淒涼淩減湊凜幾鳳鳧憑凱擊氹鑿芻劃劉則剛創刪別剗剄劊劌剴劑剮劍剝劇勸辦務勱動勵勁勞勢勳猛勩勻匭匱區醫華協單賣盧鹵臥衛卻巹廠廳曆厲壓厭厙廁廂厴廈廚廄廝縣參靉靆雙發變敘疊葉號歎嘰籲後嚇呂嗎唚噸聽啟吳嘸囈嘔嚦唄員咼嗆嗚詠哢嚨嚀噝吒噅鹹呱響啞噠嘵嗶噦嘩噲嚌噥喲嘜嗊嘮啢嗩唕喚呼嘖嗇囀齧囉嘽嘯噴嘍嚳囁嗬噯噓嚶囑嚕劈囂謔團園囪圍圇國圖圓聖壙場阪壞塊堅壇壢壩塢墳墜壟壟壚壘墾坰堊墊埡墶壋塏堖塒塤堝墊垵塹墮壪牆壯聲殼壺壼處備複夠頭誇夾奪奩奐奮獎奧妝婦媽嫵嫗媯姍薑婁婭嬈嬌孌娛媧嫻嫿嬰嬋嬸媼嬡嬪嬙嬤孫學孿寧寶實寵審憲宮寬賓寢對尋導壽將爾塵堯尷屍盡層屭屜屆屬屢屨嶼歲豈嶇崗峴嶴嵐島嶺嶽崠巋嶨嶧峽嶢嶠崢巒嶗崍嶮嶄嶸嶔崳嶁脊巔鞏巰幣帥師幃帳簾幟帶幀幫幬幘幗冪襆幹並廣莊慶廬廡庫應廟龐廢廎廩開異棄張彌弳彎彈強歸當錄彠彥徹徑徠禦憶懺憂愾懷態慫憮慪悵愴憐總懟懌戀懇惡慟懨愷惻惱惲悅愨懸慳憫驚懼慘懲憊愜慚憚慣湣慍憤憒願懾憖怵懣懶懍戇戔戲戧戰戩戶紮撲扡執擴捫掃揚擾撫拋摶摳掄搶護報擔擬攏揀擁攔擰撥擇掛摯攣掗撾撻挾撓擋撟掙擠揮撏撈損撿換搗據撚擄摑擲撣摻摜摣攬撳攙擱摟攪攜攝攄擺搖擯攤攖撐攆擷擼攛擻攢敵斂數齋斕鬥斬斷無舊時曠暘曇晝曨顯晉曬曉曄暈暉暫曖劄術樸機殺雜權條來楊榪傑極構樅樞棗櫪梘棖槍楓梟櫃檸檉梔柵標棧櫛櫳棟櫨櫟欄樹棲樣欒棬椏橈楨檔榿橋樺檜槳樁夢檮棶檢欞槨櫝槧欏橢樓欖櫬櫚櫸檟檻檳櫧橫檣櫻櫫櫥櫓櫞簷檁歡歟歐殲歿殤殘殞殮殫殯毆毀轂畢斃氈毿氌氣氫氬氳彙漢汙湯洶遝溝沒灃漚瀝淪滄渢溈滬濔濘淚澩瀧瀘濼瀉潑澤涇潔灑窪浹淺漿澆湞溮濁測澮濟瀏滻渾滸濃潯濜塗湧濤澇淶漣潿渦溳渙滌潤澗漲澀澱淵淥漬瀆漸澠漁瀋滲溫遊灣濕潰濺漵漊潷滾滯灩灄滿瀅濾濫灤濱灘澦濫瀠瀟瀲濰潛瀦瀾瀨瀕灝滅燈靈災燦煬爐燉煒熗點煉熾爍爛烴燭煙煩燒燁燴燙燼熱煥燜燾煆糊溜愛爺牘犛牽犧犢強狀獷獁猶狽麅獮獰獨狹獅獪猙獄猻獫獵獼玀豬貓蝟獻獺璣璵瑒瑪瑋環現瑲璽瑉玨琺瓏璫琿璡璉瑣瓊瑤璦璿瓔瓚甕甌電畫暢佘疇癤療瘧癘瘍鬁瘡瘋皰屙癰痙癢瘂癆瘓癇癡癉瘮瘞瘺癟癱癮癭癩癬癲臒皚皺皸盞鹽監蓋盜盤瞘眥矓著睜睞瞼瞞矚矯磯礬礦碭碼磚硨硯碸礪礱礫礎硜矽碩硤磽磑礄確鹼礙磧磣堿镟滾禮禕禰禎禱禍稟祿禪離禿稈種積稱穢穠穭稅穌穩穡窮竊竅窯竄窩窺竇窶豎競篤筍筆筧箋籠籩築篳篩簹箏籌簽簡籙簀篋籜籮簞簫簣簍籃籬籪籟糴類秈糶糲粵糞糧糝餱緊縶糸糾紆紅紂纖紇約級紈纊紀紉緯紜紘純紕紗綱納紝縱綸紛紙紋紡紵紖紐紓線紺絏紱練組紳細織終縐絆紼絀紹繹經紿綁絨結絝繞絰絎繪給絢絳絡絕絞統綆綃絹繡綌綏絛繼綈績緒綾緓續綺緋綽緔緄繩維綿綬繃綢綯綹綣綜綻綰綠綴緇緙緗緘緬纜緹緲緝縕繢緦綞緞緶線緱縋緩締縷編緡緣縉縛縟縝縫縗縞纏縭縊縑繽縹縵縲纓縮繆繅纈繚繕繒韁繾繰繯繳纘罌網羅罰罷羆羈羥羨翹翽翬耮耬聳恥聶聾職聹聯聵聰肅腸膚膁腎腫脹脅膽勝朧腖臚脛膠脈膾髒臍腦膿臠腳脫腡臉臘醃膕齶膩靦膃騰臏臢輿艤艦艙艫艱豔艸藝節羋薌蕪蘆蓯葦藶莧萇蒼苧蘇檾蘋莖蘢蔦塋煢繭荊薦薘莢蕘蓽蕎薈薺蕩榮葷滎犖熒蕁藎蓀蔭蕒葒葤藥蒞蓧萊蓮蒔萵薟獲蕕瑩鶯蓴蘀蘿螢營縈蕭薩蔥蕆蕢蔣蔞藍薊蘺蕷鎣驀薔蘞藺藹蘄蘊藪槁蘚虜慮虛蟲虯蟣雖蝦蠆蝕蟻螞蠶蠔蜆蠱蠣蟶蠻蟄蛺蟯螄蠐蛻蝸蠟蠅蟈蟬蠍螻蠑螿蟎蠨釁銜補襯袞襖嫋褘襪襲襏裝襠褌褳襝褲襇褸襤繈襴見觀覎規覓視覘覽覺覬覡覿覥覦覯覲覷觴觸觶讋譽謄訁計訂訃認譏訐訌討讓訕訖訓議訊記訒講諱謳詎訝訥許訛論訩訟諷設訪訣證詁訶評詛識詗詐訴診詆謅詞詘詔詖譯詒誆誄試詿詩詰詼誠誅詵話誕詬詮詭詢詣諍該詳詫諢詡譸誡誣語誚誤誥誘誨誑說誦誒請諸諏諾讀諑誹課諉諛誰諗調諂諒諄誶談誼謀諶諜謊諫諧謔謁謂諤諭諼讒諮諳諺諦謎諞諝謨讜謖謝謠謗諡謙謐謹謾謫譾謬譚譖譙讕譜譎讞譴譫讖穀豶貝貞負貟貢財責賢敗賬貨質販貪貧貶購貯貫貳賤賁貰貼貴貺貸貿費賀貽賊贄賈賄貲賃賂贓資賅贐賕賑賚賒賦賭齎贖賞賜贔賙賡賠賧賴賵贅賻賺賽賾贗讚贇贈贍贏贛赬趙趕趨趲躉躍蹌蹠躒踐躂蹺蹕躚躋踴躊蹤躓躑躡蹣躕躥躪躦軀車軋軌軒軑軔轉軛輪軟轟軲軻轤軸軹軼軤軫轢軺輕軾載輊轎輈輇輅較輒輔輛輦輩輝輥輞輬輟輜輳輻輯轀輸轡轅轄輾轆轍轔辭辯辮邊遼達遷過邁運還這進遠違連遲邇逕跡適選遜遞邐邏遺遙鄧鄺鄔郵鄒鄴鄰鬱郤郟鄶鄭鄆酈鄖鄲醞醱醬釅釃釀釋裏钜鑒鑾鏨釓釔針釘釗釙釕釷釺釧釤鈒釩釣鍆釹鍚釵鈃鈣鈈鈦鈍鈔鍾鈉鋇鋼鈑鈐鑰欽鈞鎢鉤鈧鈁鈥鈄鈕鈀鈺錢鉦鉗鈷缽鈳鉕鈽鈸鉞鑽鉬鉭鉀鈿鈾鐵鉑鈴鑠鉛鉚鈰鉉鉈鉍鈹鐸鉶銬銠鉺銪鋏鋣鐃銍鐺銅鋁銱銦鎧鍘銖銑鋌銩銛鏵銓鉿銚鉻銘錚銫鉸銥鏟銃鐋銨銀銣鑄鐒鋪鋙錸鋱鏈鏗銷鎖鋰鋥鋤鍋鋯鋨鏽銼鋝鋒鋅鋶鐦鐧銳銻鋃鋟鋦錒錆鍺錯錨錡錁錕錩錫錮鑼錘錐錦鍁錈錇錟錠鍵鋸錳錙鍥鍈鍇鏘鍶鍔鍤鍬鍾鍛鎪鍠鍰鎄鍍鎂鏤鎡鏌鎮鎛鎘鑷鐫鎳鎿鎦鎬鎊鎰鎔鏢鏜鏍鏰鏞鏡鏑鏃鏇鏐鐔钁鐐鏷鑥鐓鑭鐠鑹鏹鐙鑊鐳鐶鐲鐮鐿鑔鑣鑞鑲長門閂閃閆閈閉問闖閏闈閑閎間閔閌悶閘鬧閨聞闥閩閭闓閥閣閡閫鬮閱閬闍閾閹閶鬩閿閽閻閼闡闌闃闠闊闋闔闐闒闕闞闤隊陽陰陣階際陸隴陳陘陝隉隕險隨隱隸雋難雛讎靂霧霽黴靄靚靜靨韃鞽韉韝韋韌韍韓韙韞韜韻頁頂頃頇項順須頊頑顧頓頎頒頌頏預顱領頗頸頡頰頲頜潁熲頦頤頻頮頹頷頴穎顆題顒顎顓顏額顳顢顛顙顥纇顫顬顰顴風颺颭颮颯颶颸颼颻飀飄飆飆飛饗饜飣饑飥餳飩餼飪飫飭飯飲餞飾飽飼飿飴餌饒餉餄餎餃餏餅餑餖餓餘餒餕餜餛餡館餷饋餶餿饞饁饃餺餾饈饉饅饊饌饢馬馭馱馴馳驅馹駁驢駔駛駟駙駒騶駐駝駑駕驛駘驍罵駰驕驊駱駭駢驫驪騁驗騂駸駿騏騎騍騅騌驌驂騙騭騤騷騖驁騮騫騸驃騾驄驏驟驥驦驤髏髖髕鬢魘魎魚魛魢魷魨魯魴魺鮁鮃鯰鱸鮋鮓鮒鮊鮑鱟鮍鮐鮭鮚鮳鮪鮞鮦鰂鮜鱠鱭鮫鮮鮺鯗鱘鯁鱺鰱鰹鯉鰣鰷鯀鯊鯇鮶鯽鯒鯖鯪鯕鯫鯡鯤鯧鯝鯢鯰鯛鯨鯵鯴鯔鱝鰈鰏鱨鯷鰮鰃鰓鱷鰍鰒鰉鰁鱂鯿鰠鼇鰭鰨鰥鰩鰟鰜鰳鰾鱈鱉鰻鰵鱅鰼鱖鱔鱗鱒鱯鱤鱧鱣鳥鳩雞鳶鳴鳲鷗鴉鶬鴇鴆鴣鶇鸕鴨鴞鴦鴒鴟鴝鴛鴬鴕鷥鷙鴯鴰鵂鴴鵃鴿鸞鴻鵐鵓鸝鵑鵠鵝鵒鷳鵜鵡鵲鶓鵪鶤鵯鵬鵮鶉鶊鵷鷫鶘鶡鶚鶻鶿鶥鶩鷊鷂鶲鶹鶺鷁鶼鶴鷖鸚鷓鷚鷯鷦鷲鷸鷺鸇鷹鸌鸏鸛鸘鹺麥麩黃黌黶黷黲黽黿鼂鼉鞀鼴齇齊齏齒齔齕齗齟齡齙齠齜齦齬齪齲齷龍龔龕龜誌製谘隻裡係範鬆冇嚐嘗鬨麵準鐘彆閒乾儘臟';
    }
    function Traditionalized(cc){
        var str='',ss=JTPYStr(),tt=FTPYStr();
        for(var i=0;i<cc.length;i++)
        {
            if(cc.charCodeAt(i)>10000&&ss.indexOf(cc.charAt(i))!=-1)str+=tt.charAt(ss.indexOf(cc.charAt(i)));
            else str+=cc.charAt(i);
        }
        return str;
    }
    function Simplized(cc){
        var str='',ss=JTPYStr(),tt=FTPYStr();
        for(var i=0;i<cc.length;i++)
        {
            if(cc.charCodeAt(i)>10000&&tt.indexOf(cc.charAt(i))!=-1)str+=ss.charAt(tt.indexOf(cc.charAt(i)));
            else str+=cc.charAt(i);
        }
        return str;
    }


    // Function to convert image links to embedded codes
    function convertImageLinks(line) {
        const regex = /(https?:\/\/\S+\.(?:jpg|jpeg|png|gif))/i;
        const match = line.match(regex);

        if (match) {
            return line.replace(regex, '<img src="$1" alt="image">');
        }

        return line;
    }
    // Function to convert UBB code to HTML
    function convertUBBCode(line) {
        // Example: [b]bold text[/b] => <strong>bold text</strong>
        line = line.replace(/\[b\](.*?)\[\/b\]/g, '<strong>$1</strong>');
        // Add more UBB to HTML conversions as needed

        return line;
    }

    //Function to replace newline with <br>
    function replaceNewlinesWithBR(inputString) {
        return inputString.replace(/\n/g, '<br>');
    }
    // // 使用正则表达式去掉不可见字符
    function removeInvisibleCharacters(input) {

        // var res= input.replace(/[\u200B-\u200D\uFEFF]/g, '');
        var res=input
        // 使用正则表达式匹配中文和日文字符
        var chineseJapanesePattern = /[\u4e00-\u9fa5\u3040-\u30FF]+/g;
        var matches = res.match(chineseJapanesePattern);

        // 如果匹配到中文或者日文字符，去掉它们之间的空格字符
        if (matches) {
            for (var i = 0; i < matches.length; i++) {
                var match = matches[i];
                var withoutWhitespace = match.replace(/\s+/g, '');
                res = res.replace(match, withoutWhitespace);
            }
        }
        return res
    }
    function isEnglish(text) {
        // 这里可以编写检查文本是否包含英文的逻辑
        // 一个简单的方法是检查文本是否包含英文字母
        const regex = /^[a-zA-Z\s]*$/;
        return regex.test(text);
    }

    function separateTitleAndContent(text) {
        const lines = text.trim().split("\n");
        if (lines.length > 1) {
            var title = lines[0].trim();
            title = removeInvisibleCharacters(title);
            let content = lines.slice(1).join("\n").trim();

            // 检查标题长度是否超过预定字符长度
            if (isEnglish(title) && title.length > TITLE_LENGTH) {
                // 寻找最后一个空格来截断标题
                const lastSpaceIndex = title.substring(0, TITLE_LENGTH).lastIndexOf(" ");
                if (lastSpaceIndex !== -1) {
                    // 将超出的部分放入内容中
                    content = title.substring(lastSpaceIndex + 1) + " " + content;
                    title = title.substring(0, lastSpaceIndex);
                }
            } else if (title.length > TITLE_LENGTH) {
                // 将超出的部分放入内容中
                content = title.substring(TITLE_LENGTH) + " " + content;
                title = title.substring(0, TITLE_LENGTH);
            }

            console.log(title);
            console.log(content);
            return { title, content };
        } else if (lines.length = 1){
            return { title: "", content: lines[0].trim() };
        }
        return { title: "", content: "" };
    }
    function replaceCodeAndBlockquotes(str) {
        var res=""
        // 替换<code>标签
        res = str.replace(/<code>([\s\S]*?)<\/code>/g, '<div style="background-color:#f0f0f0"><span style="font-family: monospace; background-color: #f0f0f0; padding: 0px;">$1</span></div>');

        // 替换<blockquote>标签
        res = res.replace(/<blockquote>([\s\S]*?)<\/blockquote>/g, '<span style="border-left: 2px solid #999; margin: 0; padding-left: 10px; font-size: 0.8em;">$1</span>');
        return res
    }


    // 在网页上填写标题,类型,内容,来源
    function fillForm(postTitle,postType, postContent,postOrigin) {
        //页面元素
        //帖子标题
        const titleInput = document.querySelector('input[name="subject"]');
        //帖子内容
        const contentTextArea = document.querySelector('textarea[name="content"]');
        //帖子类型
        var typeSelect = document.querySelector('select[name="type"]');
        if(typeSelect==null){
            typeSelect = document.querySelector("#myform > table > tbody > tr:nth-child(2) > td > select");
        }
        //帖子来源
        var originInputOriginal=document.querySelector("#myform > table > tbody > tr:nth-child(5) > td > input[type=radio]:nth-child(2)")
        var originInputElse=document.querySelector("#myform > table > tbody > tr:nth-child(5) > td > input[type=radio]:nth-child(3)")

        if (titleInput) {
            titleInput.value = postTitle;
        } else{
            //出错了
            console.log("无法填写标题")
        }

        if (contentTextArea) {
            // contentTextArea.value = postContent;
            // 使用document.execCommand来更新textarea的内容
            contentTextArea.select();
            document.execCommand('insertText', false, postContent);

        } else{
            //出错了
            console.log("无法填写内容")
        }

        if (typeSelect) {
            typeSelect.value = postType;
        }
        if(postOrigin){
            if(originInputOriginal){
                originInputOriginal.checked = true
            }else{
                //出错了
                console.log("无法选择原创")
            }
        } else{
            if(originInputElse){
                originInputElse.checked = true
            }else{
                //出错了
                console.log("无法选择其他")
            }
        }
    }

    //自动提交
    function autoSubmit(){
        var submit_button=document.querySelector("#myform > table > tbody > tr:nth-child(5) > td > input[type=submit]:nth-child(2)")
        if(submit_button==null){
            submit_button=document.querySelector("#myform > table > tbody > tr:nth-child(5) > td > input[type=submit]:nth-child(1)")
        }
        if(submit_button) submit_button.click()
        const myButtonPostAid=document.getElementById("myButtonPostAid")
        if (myButtonPostAid) {
            // 检查按钮是否可点击
            if (!myButtonPostAid.disabled) {
                // 禁用按钮
                myButtonPostAid.disabled = true;
                // 延迟3秒后恢复按钮状态
                setTimeout(function () {
                    myButtonPostAid.disabled = false;
                }, 3000);
                // 触发按钮点击事件
                myButtonPostAid.click();
            }
        }
    }
    function extractForumName() {
        const forumElement = document.querySelector("body > table > tbody > tr > td > p > font > b > font");
        if (forumElement) {
            // 使用正则表达式提取论坛名字
            var forumContent = forumElement.textContent.trim();
            var regex = /《([^》]+)》/;
            var match = regex.exec(forumContent);

            if (match && match[1]) {
                var forumName = match[1];
                console.log("论坛名字:", forumName);
                return forumName;
            } else {
                console.log("无法从内容中提取论坛名字");
                return null; // 或者根据需要返回其他值
            }
        } else {
            console.log("未找到论坛名字的元素");
            return null; // 或者根据需要返回其他值
        }
    }

    function extractUserName() {
        // 尝试选择第一个 b 元素
        var userTag = document.querySelector('#login_user_info > b:nth-child(1)');

        // 如果第一个选择失败，尝试选择所有 b 元素中的第一个
        if (!userTag) {
            userTag = document.querySelector("#login_user_info > b");
        }

        // 检查是否找到了用户标签
        if (userTag) {
            // 提取用户名
            var userName = userTag.textContent.trim();

            // 输出用户名或者根据需要进行其他处理
            console.log("当前用户:", userName);

            // 返回用户名
            return userName;
        } else {
            console.log("未找到用户标签");
            return null; // 或者根据需要返回其他值
        }
    }


    function determineIfOriginal(textTypeContent){
        if((textTypeContent) && (textTypeContent.includes("原创"))) return true;
        return false;
    }

    function aidAction() {
        try {
            // 确定当前用户
            const user = extractUserName();
            // 确定当前论坛
            const forum = extractForumName();
            // 获取填写的内容
            const textAreaContent = getTextAreaContent();
            // 获取标题的内容
            const textSubjectContent = getSubjectContent();
            // 获取类型的内容
            const textTypeContent = getTypeContent();

            let title = "";
            let content = "";

            if (textSubjectContent === "") {
                if (textAreaContent !== "") {
                    // 分离标题跟内容
                    const sepResult = separateTitleAndContent(textAreaContent);
                    title = sepResult.title;
                    content = sepResult.content;
                } else {
                    console.error("标题和内容均为空");
                    return false; // 在出错情况下提前返回
                }
            } else {
                title = textSubjectContent;
                content = textAreaContent;
            }

            // 繁简转换
            if (content && CONVERT_TO_SIMPLIZED_CHINESE && content !== "") {
                content = Simplized(content);
            }

            if (textSubjectContent === ""&&IF_ADD_TITLE_PREFIX) {
                // 修改标题
                // title = determineTitlePrefix(user, forum, title)+title;
                title = determineTitlePrefix(title, content, user, forum)+title;
            }

            // 智能转化为 HTML 代码
            const convertedContent = convertHTMLCode(content);
            content = REPLACE_LINE_WITH_BR ? replaceNewlinesWithBR(convertedContent) : convertedContent;
            content = REPLACE_FILTERED_TAG ? replaceCodeAndBlockquotes(content) : content;

            // 填写帖子
            // 选择帖子类型
            let postType = "";
            if (textTypeContent === "" ||textTypeContent === "未知") {
                postType = determinePostType(title, content, user, forum);
            } else {
                postType = textTypeContent;
            }

            // 帖子是否原创
            let isOriginal = determineIfOriginal(textTypeContent);
            fillForm(title, postType, content, isOriginal);
            return true;
        } catch (error) {
            console.error("An error occurred:", error);
            return false;
        }
    }

    document.addEventListener('keydown', function(e) {
        // 获取textarea元素
        const textarea = document.querySelector('textarea');

        // 检查是否有选中的文本
        if (textarea && textarea.selectionStart !== undefined) {
            // 获取选中文本的开始和结束位置
            var selectionStart = textarea.selectionStart;
            var selectionEnd = textarea.selectionEnd;
            // 获取选中的文本
            var selectedText = textarea.value.substring(selectionStart, selectionEnd);

            // 排除选中文本末尾的换行符
            if (selectedText.endsWith('\n')) {
                selectionEnd--;
                textarea.setSelectionRange(selectionStart, selectionEnd)
                // 重新获取选中的文本
                selectedText = textarea.value.substring(selectionStart, selectionEnd);
            }

            // 处理不同的快捷键
            switch (true) {
                case e.ctrlKey && (e.key === '1' || e.key === 'End'): // 'End' key for numeric keypad 1
                    e.preventDefault();
                    wrapText('<h1>', '</h1>');
                    break;
                case e.ctrlKey && (e.key === '2' || e.key === 'Down'): // 'Down' key for numeric keypad 2
                    e.preventDefault();
                    wrapText('<h2>', '</h2>');
                    break;
                case e.ctrlKey && (e.key === '3' || e.key === 'PageDown'): // 'PageDown' key for numeric keypad 3
                    e.preventDefault();
                    wrapText('<h3>', '</h3>');
                    break;
                case e.ctrlKey && (e.key === '4' || e.key === 'Left'): // 'Left' key for numeric keypad 4
                    e.preventDefault();
                    wrapText('<h4>', '</h4>');
                    break;
                case e.ctrlKey && (e.key === '5' || e.key === 'Right'): // 'Right' key for numeric keypad 5
                    e.preventDefault();
                    wrapText('<h5>', '</h5>');
                    break;
                case e.ctrlKey && e.key === 'i':
                    e.preventDefault();
                    wrapText('<i>', '</i>');
                    break;
                case e.ctrlKey && e.key === 'u':
                    e.preventDefault();
                    wrapText('<u>', '</u>');
                    break;
                case e.ctrlKey && e.key === 'b':
                    e.preventDefault();
                    wrapText('<b>', '</b>');
                    break;
                case e.ctrlKey && e.key === 'k':
                    e.preventDefault();
                    wrapText('<code>', '</code>');
                    break;
                case e.ctrlKey && e.key === 'q':
                    e.preventDefault();
                    wrapText('<blockquote>', '</blockquote>');
                    break;
                case e.ctrlKey && e.key === 'z':
                    e.preventDefault();
                    undo();
                    break;
                case e.ctrlKey && e.key === 'y':
                    e.preventDefault();
                    redo();
                    break;
            }
        }

        //         function wrapText(startTag, endTag) {
        //             // 包裹文本
        //             var wrappedText = startTag + selectedText + endTag;

        //             // 创建一个input事件
        //             var inputEvent = new InputEvent('input', {
        //                 inputType: 'insertText',
        //                 data: wrappedText,
        //                 bubbles: true,
        //                 cancelable: true
        //             });

        //             // 插入文本
        //             textarea.setRangeText(wrappedText, selectionStart, selectionEnd, 'end');

        //             // 触发input事件
        //             textarea.dispatchEvent(inputEvent);

        //             // 将焦点设置回textarea
        //             textarea.focus();
        //         }
        function wrapText(startTag, endTag) {
            // 包裹文本
            var wrappedText = startTag + selectedText + endTag;

            // 使用document.execCommand来更新textarea的内容
            document.execCommand('insertText', false, wrappedText);

            // 将焦点设置回textarea
            textarea.focus();
        }
        // 撤销
        // document.execCommand 似乎要被deprecated?
        function undo() {
            document.execCommand('undo', false, null);
        }

        // 重做
        function redo() {
            document.execCommand('redo', false, null);
        }
    });

    //切换到html代码
    const html_button=document.querySelector("#toolbar-content > div.toolbar > a.tool_html")
    if(html_button) html_button.click()

    //Create button
    var zNode = document.createElement ('div');
    zNode.innerHTML = '<button id="myButtonPostAid" type="button">'
        + '填写帖子</button>';
    zNode.setAttribute ('id', 'myContainerPostAid');
    if (!document.body.classList.contains('frameBody')){
        document.body.appendChild (zNode);
        document.getElementById ("myButtonPostAid").addEventListener (
            "click", ButtonClickAction, false
        );
        //Button click function
        function ButtonClickAction (zEvent) {
            var res=aidAction();
            if(AUTO_SUBMIT) autoSubmit();
        }}

    //Button style
    GM_addStyle ( `
    #myContainerPostAid{
        position:               fixed;
        top:                   180px;
        left:                   30px;
        font-size:              10px;
        background:             orange;
        border:                 1px outset black;
        margin:                 3px;
        opacity:                0.5;
        z-index:                9999;
        padding:                2px 2px;
    }
    #myButtonPostAid {
        cursor:                 pointer;
    }
    #myContainerPostAid{
        color:                  red;
        background:             white;
    }
` );
})();
