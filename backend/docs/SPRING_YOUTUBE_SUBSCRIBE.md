# Spring Boot Subscribe YouTube API v3

## 1) pom.xml dependencies

```xml
<dependencies>
    <dependency>
        <groupId>com.google.apis</groupId>
        <artifactId>google-api-services-youtube</artifactId>
        <version>v3-rev20241010-2.0.0</version>
    </dependency>
    <dependency>
        <groupId>com.google.auth</groupId>
        <artifactId>google-auth-library-oauth2-http</artifactId>
        <version>1.30.0</version>
    </dependency>
</dependencies>
```

## 2) application.yml

```yaml
youtube:
  channel-id: UCxxxxxxxxxxxxxxxxxx
```

## 3) DTO request

```java
package com.example.lms.youtube.dto;

import com.fasterxml.jackson.annotation.JsonProperty;

public class SubscribeRequest {
    @JsonProperty("access_token")
    private String accessToken;

    @JsonProperty("channel_id")
    private String channelId;

    public String getAccessToken() {
        return accessToken;
    }

    public void setAccessToken(String accessToken) {
        this.accessToken = accessToken;
    }

    public String getChannelId() {
        return channelId;
    }

    public void setChannelId(String channelId) {
        this.channelId = channelId;
    }
}
```

## 4) Service

```java
package com.example.lms.youtube;

import com.google.api.client.googleapis.javanet.GoogleNetHttpTransport;
import com.google.api.client.http.HttpRequestInitializer;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.jackson2.JacksonFactory;
import com.google.api.services.youtube.YouTube;
import com.google.api.services.youtube.model.ResourceId;
import com.google.api.services.youtube.model.Subscription;
import com.google.api.services.youtube.model.SubscriptionSnippet;
import org.springframework.stereotype.Service;

@Service
public class YoutubeSubscriptionService {

    public String subscribeChannel(String accessToken, String channelId) throws Exception {
        NetHttpTransport transport = GoogleNetHttpTransport.newTrustedTransport();

        HttpRequestInitializer requestInitializer = request ->
                request.getHeaders().setAuthorization("Bearer " + accessToken);

        YouTube youtube = new YouTube.Builder(
                transport,
                JacksonFactory.getDefaultInstance(),
                requestInitializer
        ).setApplicationName("lms-youtube-subscribe").build();

        ResourceId resourceId = new ResourceId();
        resourceId.setKind("youtube#channel");
        resourceId.setChannelId(channelId);

        SubscriptionSnippet snippet = new SubscriptionSnippet();
        snippet.setResourceId(resourceId);

        Subscription subscription = new Subscription();
        subscription.setSnippet(snippet);

        Subscription inserted = youtube.subscriptions()
                .insert("snippet", subscription)
                .execute();

        return inserted.getId();
    }
}
```

## 5) Controller

```java
package com.example.lms.youtube;

import com.example.lms.youtube.dto.SubscribeRequest;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.util.StringUtils;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/youtube")
public class YoutubeSubscriptionController {

    private final YoutubeSubscriptionService youtubeSubscriptionService;

    @Value("${youtube.channel-id}")
    private String defaultChannelId;

    public YoutubeSubscriptionController(YoutubeSubscriptionService youtubeSubscriptionService) {
        this.youtubeSubscriptionService = youtubeSubscriptionService;
    }

    @PostMapping("/subscribe")
    public ResponseEntity<?> subscribe(@RequestBody SubscribeRequest request) {
        if (request == null || !StringUtils.hasText(request.getAccessToken())) {
            return ResponseEntity.badRequest().body(Map.of(
                    "success", false,
                    "message", "access_token is required"
            ));
        }

        String channelId = StringUtils.hasText(request.getChannelId())
                ? request.getChannelId()
                : defaultChannelId;

        try {
            String subscriptionId = youtubeSubscriptionService.subscribeChannel(request.getAccessToken(), channelId);
            Map<String, Object> data = new HashMap<>();
            data.put("subscriptionId", subscriptionId);
            data.put("channelId", channelId);

            return ResponseEntity.ok(Map.of(
                    "success", true,
                    "message", "Subscribed successfully",
                    "data", data
            ));
        } catch (Exception ex) {
            String msg = ex.getMessage() == null ? "Subscription failed" : ex.getMessage();

            if (msg.contains("401") || msg.toLowerCase().contains("invalid credentials")) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of(
                        "success", false,
                        "message", "Invalid or expired access token"
                ));
            }

            if (msg.contains("403") || msg.toLowerCase().contains("insufficientpermissions")) {
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                        "success", false,
                        "message", "Insufficient permission, require youtube.force-ssl scope"
                ));
            }

            if (msg.toLowerCase().contains("subscriptionduplicate")) {
                return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                        "success", true,
                        "message", "Already subscribed",
                        "data", Map.of("channelId", channelId, "alreadySubscribed", true)
                ));
            }

            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of(
                    "success", false,
                    "message", "Error subscribing channel",
                    "error", msg
            ));
        }
    }
}
```

## 6) Frontend usage (React)

```js
const handleSubscribe = async () => {
  const response = await httpClient.post('/youtube/subscribe', {
    access_token: accessToken,
    channel_id: channelId,
  });

  if (response?.data?.success) {
    setCanWatchVideo(true);
  }
};
```

## Notes

- Google OAuth scope ở frontend cần có `https://www.googleapis.com/auth/youtube.force-ssl`.
- User phải đăng nhập tài khoản YouTube hợp lệ.
- Access token được gửi từ frontend sang backend bằng JSON body.
