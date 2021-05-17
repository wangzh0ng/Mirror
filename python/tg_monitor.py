# pip3 install telethon pysocks httpx 或者 py -3 -m pip install telethon pysocks httpx
# pip install urllib3==1.25.11

import os
import re
import json


count = 2  # 此部分参考了 178.py
while count:
    try:
        from telethon import TelegramClient, events, connection
        from telethon.sessions import StringSession
        break
    except:
        print('检测到没有 telethon 库，开始换源进行安装')
        if count == 2:
            pip = 'pip3'
        else:
            pip = 'pip'
        os.system(
            f'{pip} install telethon -i https://pypi.tuna.tsinghua.edu.cn/simple')
        count -= 1
        continue
count = 2
while count:
    try:
        import requests
        break
    except:
        print('检测到没有 requests 库，开始换源进行安装')
        if count == 2:
            pip = 'pip3'
        else:
            pip = 'pip'
        os.system(
            f'{pip} install requests -i https://pypi.tuna.tsinghua.edu.cn/simple')
        count -= 1
        continue


# 打开https://my.telegram.org，点击API development tools根据信息填写api_id和api_hash
api_id = ''
api_hash = ''
tg_user_id = ''
tg_bot_token = ''
tg_notify_count = 5  # 多少条以后统一推送
output_msg = True  # 是否打印消息
channel_white_list = [1197524983]  # 过滤频道消息
cookies = [
    "", ""
]

client = TelegramClient(
    'auto',
    api_id,
    api_hash,
    # proxy={
    #     'proxy_type': 'socks5',
    #     'addr': '127.0.0.1',
    #     'port': '7890',
    #     # 'username': '',
    #     # 'password': ''
    # }
)

msgs = []


def get_bean(url):
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/88.0.4324.104 Safari/537.36",
        # "Referer": "",
        "Accept-Encoding": "gzip,compress,br,deflate",
        "Cookie": "",
    }
    for i in range(len(cookies)):
        headers['Cookie'] = cookies[i]
        # headers['Referer'] = Referer
        res = requests.get(url, headers=headers).json()
        if res['code'] != '0':
            print(
                f'【提示】京东账号{i + 1}：cookie已失效，请重新登录获取，https://bean.m.jd.com/bean/signIndex.action')
        else:
            rearWord = res['result']['giftDesc']
            msg = f'京东账号{i + 1}：{rearWord}'
            print(msg)
            if "None" in rearWord:
                continue
            else:
                msgs.append(msg)


# tg推送
def telegram_bot(title, content):
    print("\n")
    if not tg_bot_token or not tg_user_id:
        return
    print("Telegram 推送开始")
    send_data = {"chat_id": tg_user_id, "text": f'{title}\n\n{content}',
                 "disable_web_page_preview": "true"}
    response = requests.post(
        url='https://api.telegram.org/bot%s/sendMessage' % (tg_bot_token), data=send_data)
    print(response.text)


def push():
    if len(msgs) > tg_notify_count:
        telegram_bot("关注有礼", ' '.join(map(str, msgs)))
        msgs.clear()


# @client.on(events.NewMessage(chats=[-1001479368440], from_users=[1197524983]))
@client.on(events.NewMessage(chats=[-1001197524983]))  # 频道
async def my_event_handler(event):
    # if event.peer_id.channel_id not in channel_white_list :
    #     return
    regex = re.compile(r"(https://api.m.jd.com.*)\)", re.M)
    jdUrl = re.findall(regex, event.message.text)
    if output_msg:
        print(event.message.text)
    if len(jdUrl) == 1:
        get_bean(jdUrl[0])
    # print(event.message.text)
    msgs.append(event.message.text)
    push()


async def get_user_info():
    # Getting information about yourself
    me = await client.get_me()
    # "me" is a user object. You can pretty-print
    # any Telegram object with the "stringify" method:
    print(f'您的个人信息为:\n{me.stringify()}')

    async for dialog in client.iter_dialogs():
        print(f'【{"用户" if dialog.is_user else ""}{"群组" if dialog.is_group else ""}{"频道" if dialog.is_channel else ""}】',
              dialog.name, 'has ID', dialog.id)

with client:
    # client.loop.run_until_complete(get_user_info())
    client.loop.run_forever()
