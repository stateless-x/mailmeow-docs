---
title: ส่งอีเมลแรก
description: ขอคีย์ทดสอบ ส่งอีเมลแรกด้วย cURL หรือ Resend SDK เช็กสถานะ แล้วเปลี่ยนไปใช้จริง
---

มีแค่ API key ก็เริ่มได้เลย และส่งด้วยคีย์ทดสอบได้ก่อนตั้งค่าโดเมน

## 1. ขอ API key

คีย์มี 2 แบบ

| คีย์ | ขึ้นต้นด้วย | เกิดอะไรขึ้น |
|---|---|---|
| คีย์ทดสอบ | `mm_test_...` | ไม่มีอีเมลไปถึงคนจริง แต่สถานะขึ้นเหมือนส่งจริง ลองได้สบายใจ |
| คีย์ใช้จริง | `mm_live_...` | ส่งถึงคนจริง ต้องยืนยันโดเมนก่อน |

สร้างคีย์ได้ในแดชบอร์ดที่หน้า **API keys** คีย์เต็มจะโชว์ครั้งเดียว ก๊อปเก็บไว้ก่อนปิดหน้า ช่วง private beta ให้ขอคีย์จากแอดมิน mailmeow

เก็บคีย์ไว้ในตัวแปร environment

```bash
export MAILMEOW_API_KEY=mm_test_xxxxxxxxxxxx
```

## 2. ส่งอีเมล

**cURL**

```bash
curl -X POST https://api.mailmeow.dev/emails \
  -H "Authorization: Bearer $MAILMEOW_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "Acme <hello@acme.com>",
    "to": "you@example.com",
    "subject": "Hello from mailmeow",
    "html": "<p>It works!</p>"
  }'
```

**Node.js (Resend SDK)**

```bash
npm install resend
```

```ts
import { Resend } from 'resend';

const resend = new Resend(process.env.MAILMEOW_API_KEY, {
  baseUrl: 'https://api.mailmeow.dev',
});

const { data, error } = await resend.emails.send({
  from: 'Acme <hello@acme.com>',
  to: 'you@example.com',
  subject: 'Hello from mailmeow',
  html: '<p>It works!</p>',
});

if (error) {
  console.error(error.name, error.message);
} else {
  console.log('Sent:', data.id);
}
```

แพ็กเกจ `mailmeow` ยังไม่ได้ปล่อยบน npm ตัวอย่างนี้เลยใช้แพ็กเกจ `resend` ที่ใช้กับ mailmeow ได้ ถ้าใช้ `resend` อยู่แล้วก็ใช้ต่อได้เลย ดู [ย้ายจาก Resend](/th/migrate-from-resend/)

## 3. เช็กว่าเกิดอะไรขึ้น

วิธีที่ง่ายที่สุดคือเปิดหน้า **Emails** ในแดชบอร์ดแล้วเลือกอีเมลที่ส่ง จะเห็นว่าแต่ละฉบับไปถึงไหนแล้ว

ถ้าจะดูจากโค้ด ต้องใช้คีย์สิทธิ์เต็ม (Full access) คีย์ใหม่เริ่มต้นเป็นสิทธิ์ส่งอีเมลอย่างเดียว (Send only) เพราะปลอดภัยกว่าถ้าคีย์หลุด และจะได้ `403 restricted_api_key` ตรงนี้ ถ้าอยากตามสถานะจากโค้ดด้วยคีย์ส่งอย่างเดียว ให้ใช้ [webhook](/th/webhooks/) แทน

```bash
curl https://api.mailmeow.dev/emails/<id> \
  -H "Authorization: Bearer $MAILMEOW_API_KEY"
```

`last_event` บอกว่าอีเมลอยู่ขั้นไหน เช่น `queued` `sent` `delivered` `bounced` ดูความหมายที่ [เรื่องที่ควรรู้](/th/concepts/#email-statuses)

## 4. เปลี่ยนไปใช้จริง

1. [ยืนยันโดเมน](/th/domain/) โดยเพิ่ม DNS record ที่เราให้
2. เปลี่ยนคีย์ `mm_test_` เป็นคีย์ `mm_live_`
3. ถ้าต้องการ เพิ่ม [webhook](/th/webhooks/) แอปจะได้รู้ตอนอีเมลตีกลับหรือถูกแจ้งสแปม

แค่นี้เอง
