# Alexa My Smart Home Skill

[ECHONET Lite](https://echonet.jp/spec_g/#standard-01)に対応したエアコン（ダイキン無線LANアダプターBRP072A44）をAlexaスキル（スマートホームスキル）である。

デバイス、サービス間の連携は以下のとおり。

```
Amazon Echo - AWS Lambda - AWS IoT - Raspberry Pi - エアコン
```

## リンク

- [MDN Web Docs - JavaScript リファレンス](https://developer.mozilla.org/docs/Web/JavaScript/Reference)
- [Node.js v6.10.3 Documentation](https://nodejs.org/docs/v6.10.3/api/)

- [AWSマネジメントコンソール](https://console.aws.amazon.com/)
- [開発者コンソール](https://developer.amazon.com/home.html)
  - スキルを動作させたいEchoなどのデバイスを登録したアカウントでログインすること

- AWS
  - [AWS SDK for JavaScript](http://docs.amazonwebservices.com/AWSJavaScriptSDK/latest/frames.html)

- AWS IoT
  - [開発者ガイド](http://docs.aws.amazon.com/iot/latest/developerguide/)
    - [Raspberry Pi の接続](https://docs.aws.amazon.com/iot/latest/developerguide/iot-sdk-setup.html)
  - [AWS IoT SDK for JavaScript](https://github.com/aws/aws-iot-device-sdk-js)

- Alexa Skills Kitドキュメント
  - [スマートホームスキルの作成手順](https://developer.amazon.com/ja/docs/smarthome/steps-to-build-a-smart-home-skill.html)
    - 日本語のスキルのLambda関数はオレゴンリージョンにデプロイする
    - 日本語のスキルではデバイスのカテゴリーとして[照明またはスイッチしか使用できない](https://developer.amazon.com/ja/docs/smarthome/develop-smart-home-skills-in-multiple-languages.html#decide-languages)
  - [スマートホームスキルAPIのメッセージリファレンス](https://developer.amazon.com/ja/docs/smarthome/smart-home-skill-api-message-reference.html)
  - [Build a Working Smart Home Skill in 15 Minutes](https://github.com/alexa/alexa-smarthome/wiki/Build-a-Working-Smart-Home-Skill-in-15-Minutes)（ただしPython）
