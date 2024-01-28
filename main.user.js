// ==UserScript==
// @name         个人工具-留园发帖小助手
// @namespace    http://www.6park.com/
// @version      0.1
// @description  留园发帖小助手,让发帖更简单更好看，目前尚在开发中。
// @author       lyabc@6park
// @license      MIT
// @match        https://web.6parkbbs.com/index.php?app=forum&act=post&bbsid*
// @match        https://club.6parkbbs.com/know1/index.php?app=forum&act=postnew*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        GM_addStyle
// @downloadURL  https://github.com/cbayl/parkpostpilot/raw/main/main.user.js
// @updateURL    https://github.com/cbayl/parkpostpilot/raw/main/main.user.js


// ==/UserScript==

(function() {
    'use strict';
    const TITLE_LENGTH=60
    const REPLACE_LINE_WITH_BR=false
    console.log("留园发帖小助手")

    // 获取并填写内容
    function getTextAreaContent() {
        //获得填写的内容
        const contentTextArea = document.querySelector('textarea[name="content"]');
        const textAreaContent = contentTextArea.value;
        return textAreaContent

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
                if (line.startsWith("https://www.youtu")||line.startsWith("https://youtu.be")) {
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

            return `<embed src="https://www.youtube.com/v/${videoId}" type="application/x-shockwave-flash" width="480" height="320" allowfullscreen="true" style="margin:2px;">`;
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


    // 在网页上填写标题和内容
    function fillForm(title, content) {
        const titleInput = document.querySelector('input[name="subject"]');
        const contentTextArea = document.querySelector('textarea[name="content"]');

        if (titleInput) {
            titleInput.value = title;
        } else{
            //出错了
            console.log("无法填写标题")
        }

        if (contentTextArea) {
            contentTextArea.value = content;

        } else{
            //出错了
            console.log("无法填写内容")
        }
    }

    function AidAction(){
        //获得填写的内容
        const textAreaContent= getTextAreaContent();
        //确定当前用户
        const user_tag=document.querySelector('#login_user_info > b:nth-child(1)');
        if(!user_tag){
            user_tag=document.querySelector("#login_user_info > b");

        }
        const user=user_tag.textContent.trim();
        //智能转化为html代码
        var content=convertHTMLCode(textAreaContent)
        var title=""

        //确定当前论坛

        //         //繁简转换
        //         var simplified_cc=Simplized(textAreaContent)
        //         //分离标题跟内容
        //         var { title, content } = separateTitleAndContent(simplified_cc);
        //         // if(title=="") return false;
        //         //修改标题
        //         title=modTitle(user,title)
        //         //选择帖子类型
        //         const postType = choosePostType(user,title,content);
        //         //填写帖子类型
        //         var typeSelect = document.querySelector('select[name="type"]');
        //         if(typeSelect==null){
        //             typeSelect = document.querySelector("#myform > table > tbody > tr:nth-child(2) > td > select");
        //         }
        //         if (typeSelect) {
        //             typeSelect.value = postType;
        //         }
        if(REPLACE_LINE_WITH_BR) content=replaceNewlinesWithBR(content);
        //填写内容跟标题
        fillForm(title, content);


        return true;

    }



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
            var res=AidAction();

            // var submit_button=document.querySelector("#myform > table > tbody > tr:nth-child(5) > td > input[type=submit]:nth-child(2)")
            // if(submit_button==null){
            //     submit_button=document.querySelector("#myform > table > tbody > tr:nth-child(5) > td > input[type=submit]:nth-child(1)")
            // }
            // if(submit_button) submit_button.click()
            // const myButtonPostAid=document.getElementById("myButtonPostAid")
            // if (myButtonPostAid) {
            //     // 检查按钮是否可点击
            //     if (!myButtonPostAid.disabled) {
            //         // 禁用按钮
            //         myButtonPostAid.disabled = true;
            //         // 延迟3秒后恢复按钮状态
            //         setTimeout(function () {
            //             myButtonPostAid.disabled = false;
            //         }, 3000);
            //         // 触发按钮点击事件
            //         myButtonPostAid.click();
            //     }
            // }

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
