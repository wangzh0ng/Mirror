import requests
import time
import re
import rsa
import base64
import hashlib
import os

currAccount = 0
tianyi_session = requests.Session()
headers = {
    'User-Agent': 'Mozilla/5.0 (Linux; Android 5.1.1; SM-G930K Build/NRD90M; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/74.0.3729.136 Mobile Safari/537.36 Ecloud/8.6.3 Android/22 clientId/355325117317828 clientModel/SM-G930K imsi/460071114317824 clientChannelId/qq proVersion/1.0.6',
    "Referer": "https://m.cloud.189.cn/zhuanti/2016/sign/index.jsp?albumBackupOpened=1",
    "Host": "m.cloud.189.cn",
    "Accept-Encoding": "gzip, deflate",
}


def readSecret(key):
    if key in os.environ and not os.environ[key].strip() == '':
        return os.environ[key]
    else:
        return None


def main():
    # 账号密码用空格换行,可以支持多个账号,依次换行就行
    cookies = readSecret("CLOUD189_ACCOUNT")
    if cookies is None:
        send_notify("天翼云签到", "未获取到正确配置")
        return
    cookieConfig = cookies.split('\n')
    accountTimes = len(cookieConfig)//2
    for index in range(0, accountTimes):
        global currAccount
        currAccount = currAccount+1
        try:
            global tianyi_session
            tianyi_session = requests.Session()
            msg = login(cookieConfig[index], cookieConfig[index+1])
            if msg != "error":
                checkin()
                lottery(1)
                lottery(2)
        except:
            print("出错了")


def send_notify(title, content):
    print(f'{title}-{currAccount}:\n{content}')
    telegram_bot(title, content)


def telegram_bot(title, content):
    print("\n")
    if "TG_BOT_TOKEN" in os.environ and "TG_USER_ID" in os.environ:
        tg_bot_token = os.environ["TG_BOT_TOKEN"]
        tg_user_id = os.environ["TG_USER_ID"]
    if not tg_bot_token or not tg_user_id:
        print("Telegram推送的tg_bot_token或者tg_user_id未设置!!\n取消推送")
        return
    print("Telegram 推送开始")
    send_data = {"chat_id": tg_user_id, "text": title +
                 '\n\n'+content, "disable_web_page_preview": "true"}
    response = requests.post(
        url='https://api.telegram.org/bot%s/sendMessage' % (tg_bot_token), data=send_data)
    print(response.text)


def checkin():
    rand = str(round(time.time() * 1000))
    url = f'https://api.cloud.189.cn/mkt/userSign.action?rand={rand}&clientType=TELEANDROID&version=8.6.3&model=SM-G930K'
    response = tianyi_session.get(url, headers=headers)
    netdiskBonus = response.json()['netdiskBonus']
    try:
        if response.json()['isSign'] == "false":
            print(f"未签到，签到获得{netdiskBonus}M空间")
        else:
            print(f"已经签到过了，签到获得{netdiskBonus}M空间")
    except Exception as e:
        text = "解析签到消息失败!"
        send_notify("天翼云签到", text)


def lottery(few):
    url = ''
    if few == 1:
        url = 'https://m.cloud.189.cn/v2/drawPrizeMarketDetails.action?taskId=TASK_SIGNIN&activityId=ACT_SIGNIN'
    if few == 2:
        url = 'https://m.cloud.189.cn/v2/drawPrizeMarketDetails.action?taskId=TASK_SIGNIN_PHOTOS&activityId=ACT_SIGNIN'
    if url == '':
        print('few只能为1或2')
        return
    response = tianyi_session.get(url, headers=headers)
    if "errorCode" in response.text:
        if response.json()['errorCode'] == "User_Not_Chance":
            print(f"第{str(few)}次抽奖次数不足")
        else:
            send_notify("天翼云签到", f"第{str(few)}次抽奖出错\n{response.text}")
    else:
        message = ''
        if "prizeName" in response.json():
            message = ",获得" + response.json()['prizeName']
        print(f"第{str(few)}次抽奖完成{message}")


BI_RM = list("0123456789abcdefghijklmnopqrstuvwxyz")


def int2char(a):
    return BI_RM[a]


def b64tohex(a):
    b64map = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
    d = ""
    e = 0
    c = 0
    for i in range(len(a)):
        if list(a)[i] != "=":
            v = b64map.index(list(a)[i])
            if 0 == e:
                e = 1
                d += int2char(v >> 2)
                c = 3 & v
            elif 1 == e:
                e = 2
                d += int2char(c << 2 | v >> 4)
                c = 15 & v
            elif 2 == e:
                e = 3
                d += int2char(c)
                d += int2char(v >> 2)
                c = 3 & v
            else:
                e = 0
                d += int2char(c << 2 | v >> 4)
                d += int2char(15 & v)
    if e == 1:
        d += int2char(c << 2)
    return d


def rsa_encode(j_rsakey, string):
    rsa_key = f"-----BEGIN PUBLIC KEY-----\n{j_rsakey}\n-----END PUBLIC KEY-----"
    pubkey = rsa.PublicKey.load_pkcs1_openssl_pem(rsa_key.encode())
    result = b64tohex(
        (base64.b64encode(rsa.encrypt(f'{string}'.encode(), pubkey))).decode())
    return result


def calculate_md5_sign(params):
    return hashlib.md5('&'.join(sorted(params.split('&'))).encode('utf-8')).hexdigest()


def login(username, password):
    url = "https://cloud.189.cn/udb/udb_login.jsp?pageId=1&redirectURL=/main.action"
    r = tianyi_session.get(url)
    captchaToken = re.findall(r"captchaToken' value='(.+?)'", r.text)[0]
    lt = re.findall(r'lt = "(.+?)"', r.text)[0]
    returnUrl = re.findall(r"returnUrl = '(.+?)'", r.text)[0]
    paramId = re.findall(r'paramId = "(.+?)"', r.text)[0]
    j_rsakey = re.findall(r'j_rsaKey" value="(\S+)"', r.text, re.M)[0]
    tianyi_session.headers.update({"lt": lt})

    username = rsa_encode(j_rsakey, username)
    password = rsa_encode(j_rsakey, password)
    url = "https://open.e.189.cn/api/logbox/oauth2/loginSubmit.do"
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:74.0) Gecko/20100101 Firefox/76.0',
        'Referer': 'https://open.e.189.cn/',
    }
    data = {
        "appKey": "cloud",
        "accountType": '01',
        "userName": f"{{RSA}}{username}",
        "password": f"{{RSA}}{password}",
        "validateCode": "",
        "captchaToken": captchaToken,
        "returnUrl": returnUrl,
        "mailSuffix": "@189.cn",
        "paramId": paramId
    }
    try:
        r = tianyi_session.post(url, data=data, headers=headers, timeout=5)
        if r.json()['result'] == 0:
            print(r.json()['msg'])
        else:
            msg = r.json()['msg']
            send_notify("天翼云签到", f"登录出错\n错误提示：{msg}")
            return "error"
        redirect_url = r.json()['toUrl']
        r = tianyi_session.get(redirect_url)
        return tianyi_session
    except Exception as e:
        send_notify("天翼云签到", f"登录账号出现异常")


if __name__ == "__main__":
    main()
