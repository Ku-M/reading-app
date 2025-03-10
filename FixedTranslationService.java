package com.kum.reading.service;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * 修复后的翻译服务实现
 */
@Service
@Slf4j
public class TranslationService {

    // 有道翻译API配置
    private static final String YOUDAO_API_URL = "https://openapi.youdao.com/api";

    @Value("${translation.youdao.appId:6cc876547b730d4d}")
    private String appId;

    @Value("${translation.youdao.appKey:G1LVzjwqSAsSs60gTOo0FzCp7iXIGDh1}")
    private String appKey;

    private final RestTemplate restTemplate = new RestTemplate();

    /**
     * 翻译文本
     *
     * @param text 要翻译的文本
     * @param type 翻译类型：word-单词翻译，text-文本翻译
     * @return 翻译结果
     */
    public Map<String, Object> translate(String text, String type) {
        Map<String, Object> result = new HashMap<>();

        try {
            log.info("开始翻译文本: {}, 类型: {}", text, type);
            
            // 准备请求参数
            String salt = UUID.randomUUID().toString();
            String curtime = String.valueOf(System.currentTimeMillis() / 1000);
            
            // 使用SHA-256计算签名
            String signStr = appId + getInput(text) + salt + curtime + appKey;
            String sign = encrypt(signStr);
            
            log.debug("翻译签名参数: appId={}, salt={}, curtime={}, sign={}", appId, salt, curtime, sign);
            
            // 构建请求头
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            
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
            HttpEntity<Map<String, String>> requestEntity = new HttpEntity<>(requestBody, headers);
            
            log.debug("发送翻译请求: {}", requestBody);
            
            ResponseEntity<Map> response = restTemplate.exchange(
                    YOUDAO_API_URL,
                    HttpMethod.POST,
                    requestEntity,
                    Map.class
            );
            
            // 处理响应
            Map responseBody = response.getBody();
            log.debug("翻译响应: {}", responseBody);
            
            if (responseBody != null) {
                if ("0".equals(responseBody.get("errorCode"))) {
                    String[] translations = (String[]) responseBody.get("translation");
                    result.put("success", true);
                    result.put("translation", translations[0]);
                    result.put("original", text);
                    
                    log.info("翻译成功: {} -> {}", text, translations[0]);
                } else {
                    result.put("success", false);
                    result.put("message", "翻译失败：" + responseBody.get("errorCode"));
                    
                    log.warn("翻译失败: errorCode={}, text={}", responseBody.get("errorCode"), text);
                }
            } else {
                result.put("success", false);
                result.put("message", "翻译服务返回空响应");
                
                log.warn("翻译服务返回空响应");
            }
            
        } catch (Exception e) {
            result.put("success", false);
            result.put("message", "翻译服务异常：" + e.getMessage());
            
            log.error("翻译服务异常", e);
        }
        
        return result;
    }
    
    /**
     * 处理输入文本（官方示例中的getInput方法）
     */
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
    
    /**
     * SHA-256加密（官方示例中的encrypt方法）
     */
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