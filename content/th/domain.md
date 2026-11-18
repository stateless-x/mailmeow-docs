---
title: ตั้งค่าโดเมน
description: เพิ่ม DNS record (DKIM, return path, SPF, DMARC) เพื่อส่งอีเมลจริงจากโดเมนของคุณ
---

จะส่งอีเมลจริงจาก `you@acme.com` ได้ ต้องพิสูจน์ก่อนว่าโดเมน `acme.com` เป็นของคุณ โดยเพิ่ม DNS record แดชบอร์ดจะโชว์ค่าที่ต้องใส่ พร้อมปุ่มก๊อป

## DNS record ที่ต้องเพิ่ม

| Record | ประเภท | ทำอะไร |
|---|---|---|
| 3 อัน `<token>._domainkey.acme.com` | CNAME | **DKIM** เซ็นอีเมลของคุณ ผู้รับจะเชื่อใจมากขึ้น |
| `bounce.acme.com` | MX | **Return path** ที่ใช้รับรายงานอีเมลตีกลับ |
| `bounce.acme.com` | TXT `v=spf1 include:amazonses.com ~all` | **SPF** บอกว่าใครส่งอีเมลแทนโดเมนคุณได้ |
| `_dmarc.acme.com` | TXT `v=DMARC1; p=none;` | **DMARC** บอกผู้รับว่าถ้าตรวจไม่ผ่านให้ทำยังไง |

## ใช้เวลานานแค่ไหน

ถ้า DNS ช้า การตรวจอาจใช้เวลาถึง 72 ชั่วโมง

## ถ้ามี DMARC อยู่แล้ว

ใช้ record เดิมต่อได้เลย ไม่ต้องเปลี่ยน

## ถ้าย้ายมาจาก Resend

record ของ Resend ใช้ `send.acme.com` ส่วนของ mailmeow ใช้ `bounce.acme.com` เลยเพิ่มของเราได้โดยไม่ต้องลบของ Resend ก่อน รอให้ย้ายเสร็จแล้วค่อยลบ

ยืนยันโดเมนแล้ว ก็เปลี่ยนจาก API key `mm_test_` เป็น API key `mm_live_` ได้เลย ดูขั้นตอนที่ [ส่งอีเมลแรก](/th/quickstart/)
