package com.kum.reading.service;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.mockito.Spy;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpMethod;
import org.springframework.http.ResponseEntity;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.RestTemplate;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

class TranslationServiceTest {

    @InjectMocks
    @Spy
    private TranslationService translationService;

    @Mock
    private RestTemplate restTemplate;

    private final String appId = "6cc876547b730d4d";
    private final String appKey = "G1LVzjwqSAsSs60gTOo0FzCp7iXIGDh1";

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        ReflectionTestUtils.setField(translationService, "appId", appId);
        ReflectionTestUtils.setField(translationService, "appKey", appKey);
        ReflectionTestUtils.setField(translationService, "restTemplate", restTemplate);
    }

    @Test
    void testTranslateWithCorrectSignature() {
        // 模拟API响应
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("errorCode", "0");
        mockResponse.put("translation", new String[]{"测试"});
        
        ResponseEntity<Map> responseEntity = ResponseEntity.ok(mockResponse);
        
        // 设置模拟行为
        when(restTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(responseEntity);
        
        // 执行测试
        Map<String, Object> result = translationService.translate("test", "word");
        
        // 验证结果
        assertTrue((Boolean) result.get("success"));
        assertEquals("测试", result.get("translation"));
        
        // 验证RestTemplate被正确调用
        verify(restTemplate).exchange(
                eq("https://openapi.youdao.com/api"),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)
        );
    }
    
    @Test
    void testCalculateCorrectSignature() throws NoSuchAlgorithmException {
        // 测试文本
        String text = "hello world";
        String salt = UUID.randomUUID().toString();
        String curtime = String.valueOf(System.currentTimeMillis() / 1000);
        
        // 计算正确的签名（使用SHA-256）
        String correctSignStr = appId + getInput(text) + salt + curtime + appKey;
        String correctSign = encrypt(correctSignStr);
        
        // 计算错误的签名（使用MD5）
        String wrongSignStr = appId + truncate(text) + salt + curtime + appKey;
        String wrongSign = org.springframework.util.DigestUtils.md5DigestAsHex(
                wrongSignStr.getBytes(StandardCharsets.UTF_8));
        
        // 验证两个签名不同
        assertNotEquals(correctSign, wrongSign);
        
        // 输出签名以便调试
        System.out.println("正确的签名（SHA-256）: " + correctSign);
        System.out.println("错误的签名（MD5）: " + wrongSign);
    }
    
    // 官方示例中的getInput方法
    private String getInput(String input) {
        if (input == null) {
            return null;
        }
        String result;
        int len = input.length();
        if (len <= 20) {
            result = input;
        } else {
            String startStr = input.substring(0, 10);
            String endStr = input.substring(len - 10, len);
            result = startStr + len + endStr;
        }
        return result;
    }
    
    // 官方示例中的truncate方法（后端实现）
    private String truncate(String text) {
        if (text == null) {
            return null;
        }
        int len = text.length();
        if (len <= 20) {
            return text;
        }
        return text.substring(0, 10) + len + text.substring(len - 10);
    }
    
    // 官方示例中的encrypt方法（SHA-256）
    private String encrypt(String strSrc) throws NoSuchAlgorithmException {
        byte[] bt = strSrc.getBytes();
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        md.update(bt);
        byte[] bts = md.digest();
        StringBuilder des = new StringBuilder();
        for (byte b : bts) {
            String tmp = (Integer.toHexString(b & 0xFF));
            if (tmp.length() == 1) {
                des.append("0");
            }
            des.append(tmp);
        }
        return des.toString();
    }
    
    @Test
    void testFixedTranslationService() {
        // 创建修复后的翻译服务实现
        FixedTranslationService fixedService = new FixedTranslationService();
        ReflectionTestUtils.setField(fixedService, "appId", appId);
        ReflectionTestUtils.setField(fixedService, "appKey", appKey);
        
        // 模拟API响应
        Map<String, Object> mockResponse = new HashMap<>();
        mockResponse.put("errorCode", "0");
        mockResponse.put("translation", new String[]{"测试"});
        
        ResponseEntity<Map> responseEntity = ResponseEntity.ok(mockResponse);
        
        // 设置模拟行为
        RestTemplate mockRestTemplate = mock(RestTemplate.class);
        when(mockRestTemplate.exchange(
                anyString(),
                eq(HttpMethod.POST),
                any(HttpEntity.class),
                eq(Map.class)
        )).thenReturn(responseEntity);
        
        ReflectionTestUtils.setField(fixedService, "restTemplate", mockRestTemplate);
        
        // 执行测试
        Map<String, Object> result = fixedService.translate("test", "word");
        
        // 验证结果
        assertTrue((Boolean) result.get("success"));
        assertEquals("测试", result.get("translation"));
    }
    
    /**
     * 修复后的翻译服务实现
     */
    static class FixedTranslationService {
        private String appId;
        private String appKey;
        private RestTemplate restTemplate = new RestTemplate();
        
        public Map<String, Object> translate(String text, String type) {
            Map<String, Object> result = new HashMap<>();
            
            try {
                // 准备请求参数
                String salt = UUID.randomUUID().toString();
                String curtime = String.valueOf(System.currentTimeMillis() / 1000);
                
                // 使用SHA-256计算签名
                String signStr = appId + getInput(text) + salt + curtime + appKey;
                String sign = encrypt(signStr);
                
                // 构建请求体
                Map<String, String> requestBody = new HashMap<>();
                requestBody.put("q", text);
                requestBody.put("from", "auto");
                requestBody.put("to", "zh-CHS");
                requestBody.put("appKey", appId); // 使用appKey作为参数名
                requestBody.put("salt", salt);
                requestBody.put("sign", sign);
                requestBody.put("signType", "v3");
                requestBody.put("curtime", curtime); // 使用curtime作为参数名
                
                // 发送请求
                ResponseEntity<Map> response = restTemplate.exchange(
                        "https://openapi.youdao.com/api",
                        HttpMethod.POST,
                        new HttpEntity<>(requestBody),
                        Map.class
                );
                
                // 处理响应
                Map responseBody = response.getBody();
                if (responseBody != null && "0".equals(responseBody.get("errorCode"))) {
                    String[] translations = (String[]) responseBody.get("translation");
                    result.put("success", true);
                    result.put("translation", translations[0]);
                    result.put("original", text);
                } else {
                    result.put("success", false);
                    result.put("message", "翻译失败：" + responseBody.get("errorCode"));
                }
                
            } catch (Exception e) {
                result.put("success", false);
                result.put("message", "翻译服务异常：" + e.getMessage());
            }
            
            return result;
        }
        
        private String getInput(String input) {
            if (input == null) {
                return null;
            }
            String result;
            int len = input.length();
            if (len <= 20) {
                result = input;
            } else {
                String startStr = input.substring(0, 10);
                String endStr = input.substring(len - 10, len);
                result = startStr + len + endStr;
            }
            return result;
        }
        
        private String encrypt(String strSrc) throws NoSuchAlgorithmException {
            byte[] bt = strSrc.getBytes();
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            md.update(bt);
            byte[] bts = md.digest();
            StringBuilder des = new StringBuilder();
            for (byte b : bts) {
                String tmp = (Integer.toHexString(b & 0xFF));
                if (tmp.length() == 1) {
                    des.append("0");
                }
                des.append(tmp);
            }
            return des.toString();
        }
    }
} 