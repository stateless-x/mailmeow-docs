---
title: ส่งผ่าน SMTP
description: ตั้งค่า Supabase Auth และเครื่องมืออื่นที่ส่งได้แค่ผ่าน SMTP ให้ส่งอีเมลผ่าน mailmeow ทีละขั้น
---

ใช้ SMTP เมื่อเครื่องมือส่งอีเมลได้แค่ผ่าน SMTP ที่เจอบ่อยสุดคือ Supabase Auth อีเมลที่ Supabase ให้มาส่งได้แค่ไม่กี่ฉบับต่อชั่วโมง และมีไว้ทดสอบเท่านั้น อีเมลรหัส OTP, magic link และล็อกอินเลยไม่ถึงผู้ใช้ ตั้งให้ Supabase ส่งผ่าน mailmeow แล้วอีเมลจะกลับมาส่งได้ตามปกติ

## ค่าที่ต้องใช้

เปิดแดชบอร์ด ไปที่หน้า **API keys** แล้วหา **เชื่อมต่อผ่าน SMTP** ก๊อป Host กับ Port จากตรงนั้น

| ค่า | ใส่อะไร |
|---|---|
| Host | ก๊อปจาก **เชื่อมต่อผ่าน SMTP** |
| Port | ก๊อปจาก **เชื่อมต่อผ่าน SMTP** |
| Username | `mailmeow` (ใส่อะไรก็ได้) |
| Password | API key ของ mailmeow (`mm_test_...` หรือ `mm_live_...`) |
| Encryption | STARTTLS |
| Sender email address | อีเมลในโดเมนที่ยืนยันแล้ว เช่น `hello@acme.com` |

อีเมลทุกฉบับผ่านทางเดียวกับ `POST /emails` เลยใช้ขีดจำกัด สถานะ และ [webhooks](/th/webhooks/) เหมือนกัน

## ตั้งค่า Supabase

1. สร้าง API key ในแดชบอร์ด mailmeow เริ่มจาก API key ทดสอบ (`mm_test_...`)
2. เปิดหน้า SMTP ของ Supabase ที่ [supabase.com/dashboard/project/_/auth/smtp](https://supabase.com/dashboard/project/_/auth/smtp) แล้วเลือกโปรเจกต์ (ในเมนูอยู่ที่ **Authentication** → **Emails** → **SMTP Settings**)
3. เปิด **Enable custom SMTP**
4. กรอกช่องต่างๆ
   - **Sender email address**: `hello@acme.com` (อีเมลอะไรก็ได้ในโดเมนของตัวเอง)
   - **Sender name**: ชื่อแอป
   - **Host** และ **Port number**: ก๊อปจาก **เชื่อมต่อผ่าน SMTP**
   - **Username**: `mailmeow`
   - **Password**: API key ของ mailmeow
5. กด **Save changes**
6. ลองสมัครสมาชิกในแอปด้วยอีเมลใหม่ ถ้าใช้ API key ทดสอบ อีเมลจะขึ้นในแดชบอร์ด mailmeow โหมดทดสอบ และไม่ไปถึงกล่องอีเมลจริง

## เพิ่มขีดจำกัดอีเมลของ Supabase

พอเปิด custom SMTP แล้ว Supabase จะจำกัดไว้ที่ 30 ฉบับต่อชั่วโมงก่อน ไปที่ [Rate Limits](https://supabase.com/dashboard/project/_/auth/rate-limits) (**Authentication** → **Rate Limits**) ใน Supabase แล้วเพิ่ม **Rate limit for sending emails** ให้พอกับแอป

## เปลี่ยนไปใช้จริง

1. [ตั้งค่าโดเมน](/th/domain/) แล้วรอจนยืนยันเสร็จ
2. สร้าง API key ใช้จริง (`mm_live_...`) แล้วใส่ในช่อง **Password** ของ Supabase
3. เช็กว่า **Sender email address** อยู่ในโดเมนที่ยืนยันแล้ว

API key ใช้จริงไม่รับอีเมลที่ From หรือ Sender อยู่ในโดเมนที่ยังไม่ยืนยัน

## ข้อจำกัดและสิ่งที่ยังไม่รองรับ

- อีเมลหนึ่งฉบับใหญ่ได้ไม่เกิน 16 MB และมีผู้รับได้ไม่เกิน 50 คน
- แนบไฟล์ได้รวมไม่เกิน 10 MB และไม่เกิน 20 ไฟล์ต่ออีเมล ไฟล์บางชนิด เช่น `.exe` ส่งไม่ได้
- อีเมลที่มีผู้รับแค่ใน Bcc (เช่น `To: undisclosed-recipients:;`) จะถูกส่งแยกเป็นทีละฉบับต่อผู้รับ แต่ละคนเห็นแค่อีเมลของตัวเอง ทุกฉบับนับรวมในขีดจำกัด และแดชบอร์ดจะแสดงแยกเป็นรายฉบับ
- ส่งซ้ำได้ปลอดภัย mailmeow ดู header Message-ID กับผู้รับ ถ้าเป็นอีเมลฉบับเดิมจะไม่ส่งซ้ำ

## แก้ปัญหา

Supabase โชว์แค่ "Error sending ... email" ถ้าอยากรู้สาเหตุ เปิดหน้า **API keys** ในแดชบอร์ด mailmeow ที่ API key จะมีข้อความ "SMTP ไม่รับอีเมลล่าสุด ..." บอกเหตุผลล่าสุดที่ไม่รับ

| ข้อความจาก mailmeow | ต้องทำอะไร |
|---|---|
| Authentication failed. Use a mailmeow API key as the password. | ใส่ API key ของ mailmeow ในช่อง Password เช็กว่าก๊อปมาครบ |
| This API key was revoked. | สร้าง API key ใหม่แล้วใช้อันใหม่ |
| The From domain is not verified for this account. | [ยืนยันโดเมน](/th/domain/) หรือใช้ API key ทดสอบ |
| This account is paused, so it cannot send live email. | ใช้ API key ทดสอบ หรือติดต่อเรา |
| Sent to N of M recipients, then stopped: ... | ส่งบางฉบับใน Bcc ออกไปแล้วก่อนถึงขีดจำกัด แก้สาเหตุแล้วส่งใหม่ ระบบจะส่งเฉพาะฉบับที่ยังไม่ได้ส่ง |
| Sending these files to each Bcc recipient separately would store ... | ส่งถึงผู้รับทีละน้อยลง หรือใช้ไฟล์ที่เล็กลง |
| The file ... can't be sent. / Too many attachments. / Attachments are too large. | เอาไฟล์ชนิดที่ส่งไม่ได้ (เช่น `.exe`) ออก หรือแนบให้น้อยลงและเล็กลง รวมไม่เกิน 10 MB และ 20 ไฟล์ต่ออีเมล |
| The message is larger than 16 MB. | ลดขนาดอีเมลให้เล็กลง |
| ข้อความที่บอกว่าถึงขีดจำกัดอีเมลต่อวันหรือต่อเดือน | รอถึงเวลาที่ข้อความบอก หรือติดต่อเราเพื่อส่งเพิ่ม โหมดทดสอบเริ่มใหม่ 00:00 UTC (07:00 เวลาไทย) |
| Too many failed sign-ins / Too many connections | รอสักครู่แล้วลองใหม่ |
| Temporary error. Try again. | ลองใหม่ เครื่องมือส่วนใหญ่ลองส่งซ้ำให้เอง |

Error อื่นๆ ดูที่ [Errors](/th/errors/)

## WordPress

คู่มือ WordPress จะมาเร็วๆ นี้
