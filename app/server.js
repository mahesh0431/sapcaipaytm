const express = require('express');
const app = express();
const request = require('superagent');

let bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

const mid = "GwOpsd36675762379495";
const key = "<insert your own key>";
const website = "www.google.com";
const client_id = "WEB";

const Paytm = require('paytm-pg-node-sdk');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const router = express.Router();

var environment = Paytm.LibraryConstants.STAGING_ENVIRONMENT;

router.post('/paytmCallBackHTML', function (req, res) {
    const conversation_id = req.param('conversationid');

    request
        .post(`https://api.cai.tools.sap/connect/v1/conversations/${conversation_id}/messages`)
        .send({ messages: [{ type: 'text', content: `Your transaction: ${req.body.TXNID} is successfull and the order will be delevered soon.` }] })
        .set('Authorization', 'Token aa0deffa398d753290a5b16e7c15149f')
        .end(function (err, res) {
            console.log(res);
        });

    res.sendFile(path.join(__dirname + '/autoclose.html'));
});

router.post('/getURLPOST', async function (req, res) {
    fnGetURL(req, res);
});

const fnGetURL = async function (req, res) {

    var callbackUrl = "https://fcaf8c73trial-dev-paytmcai.cfapps.eu10.hana.ondemand.com/paytmCallBackHTML";
    callbackUrl = `${callbackUrl}?conversationid=${req.body.conversation.conversation_id}`;
    Paytm.MerchantProperties.setCallbackUrl(callbackUrl);
    Paytm.MerchantProperties.initialize(environment, mid, key, client_id, website);

    var channelId = Paytm.EChannelId.WEB;
    var orderId = uuidv4();
    var txnAmount = Paytm.Money.constructWithCurrencyAndValue(Paytm.EnumCurrency.INR, "1.00");
    var userInfo = new Paytm.UserInfo("CUSTOMER_ID");
    userInfo.setAddress("CUSTOMER_ADDRESS");
    userInfo.setEmail("mahesh.palavalli@gmail.com");
    userInfo.setFirstName("Mahesh");
    userInfo.setLastName("Palavalli");
    userInfo.setMobile("7777777777");
    var paymentDetailBuilder = new Paytm.PaymentDetailBuilder(channelId, orderId, txnAmount, userInfo);
    var paymentDetail = paymentDetailBuilder.build();
    var response = await Paytm.Payment.createTxnToken(paymentDetail);
    
    var url = "https://fcaf8c73trial.cpp.cfapps.eu10.hana.ondemand.com/c5cfafe6-22de-4c9d-b7a8-1377e4b2920c.basicservice.paytmhtml-1.0.0/index.html?";
    url = `${url}orderid=${orderId}&mid=${mid}&Token=${response.responseObject.body.txnToken}`;

    var response =
    {
        "replies": [
            {
                'type': 'buttons',
                'content': {
                    'title': "Please complete the payment.",
                    'buttons': [{
                        'value': url,
                        'title': 'Pay Here',
                        'type': 'web_url'
                    }]
                }
            }
        ],
        "conversation": {
            "language": "en",
            "memory": {
            }
        }
    };
    res.send(response);
};



const port = process.env.PORT || 3012;
app.use('/', router);
app.listen(port, function () {
    console.log('myapp listening on port ' + port);
});
