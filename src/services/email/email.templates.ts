export const emailTemplates = {
  'enrollment-status': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>신청 완료 알림</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #4CAF50; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #4CAF50; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>신청 완료 알림</h1>
        </div>
        <div class="content">
            <p>안녕하세요, [userName]님</p>
            <p>[mclassTitle] 신청이 성공적으로 완료되었습니다.</p>
            
            <div class="info-box">
                <h3>신청 정보:</h3>
                <ul>
                    <li><strong>클래스명:</strong> [mclassTitle]</li>
                    <li><strong>신청일시:</strong> [appliedAt]</li>
                    <li><strong>신청 상태:</strong> [status]</li>
                    <li><strong>신청 ID:</strong> [enrollmentId]</li>
                </ul>
            </div>
            
            <p>신청 상태는 마이페이지에서 확인하실 수 있습니다.</p>
        </div>
        <div class="footer">
            <p>이 이메일은 자동으로 발송되었습니다.</p>
        </div>
    </div>
</body>
</html>
  `,

  'enrollment-status-change': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>신청 상태 변경 알림</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #2196F3; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #2196F3; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>신청 상태 변경 알림</h1>
        </div>
        <div class="content">
            <p>안녕하세요, [userName]님</p>
            <p>[mclassTitle] 신청 상태가 변경되었습니다.</p>
            
            <div class="info-box">
                <h3>변경 정보:</h3>
                <ul>
                    <li><strong>이전 상태:</strong> [previousStatus]</li>
                    <li><strong>현재 상태:</strong> [currentStatus]</li>
                    <li><strong>변경일시:</strong> [changedAt]</li>
                    [reason]
                </ul>
            </div>
            
            <p>자세한 내용은 마이페이지에서 확인하실 수 있습니다.</p>
        </div>
        <div class="footer">
            <p>이 이메일은 자동으로 발송되었습니다.</p>
        </div>
    </div>
</body>
</html>
  `,

  'waitlist-promoted': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>대기자 승인 알림</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #FF9800; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #FF9800; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>대기자 승인 알림</h1>
        </div>
        <div class="content">
            <p>안녕하세요, [userName]님</p>
            <p>[mclassTitle] 대기자 신청이 승인되었습니다.</p>
            
            <div class="info-box">
                <h3>승인 정보:</h3>
                <ul>
                    <li><strong>클래스명:</strong> [mclassTitle]</li>
                    <li><strong>승인일시:</strong> [approvedAt]</li>
                    <li><strong>신청 ID:</strong> [enrollmentId]</li>
                </ul>
            </div>
            
            <p>이제 정식 수강생으로 등록되었습니다.</p>
        </div>
        <div class="footer">
            <p>이 이메일은 자동으로 발송되었습니다.</p>
        </div>
    </div>
</body>
</html>
  `,

  'enrollment-cancelled': `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>신청 취소 알림</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background-color: #f44336; color: white; padding: 20px; text-align: center; }
        .content { padding: 20px; background-color: #f9f9f9; }
        .info-box { background-color: white; padding: 15px; margin: 15px 0; border-left: 4px solid #f44336; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>신청 취소 알림</h1>
        </div>
        <div class="content">
            <p>안녕하세요, [userName]님</p>
            <p>[mclassTitle] 신청이 취소되었습니다.</p>
            
            <div class="info-box">
                <h3>취소 정보:</h3>
                <ul>
                    <li><strong>클래스명:</strong> [mclassTitle]</li>
                    <li><strong>취소일시:</strong> [cancelledAt]</li>
                    <li><strong>신청 ID:</strong> [enrollmentId]</li>
                </ul>
            </div>
            
            <p>다른 클래스에 관심이 있으시면 언제든지 신청해주세요.</p>
        </div>
        <div class="footer">
            <p>이 이메일은 자동으로 발송되었습니다.</p>
        </div>
    </div>
</body>
</html>
  `,
};
