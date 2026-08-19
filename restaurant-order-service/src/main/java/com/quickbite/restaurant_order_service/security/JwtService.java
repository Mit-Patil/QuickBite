package com.quickbite.restaurant_order_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import java.util.UUID;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;


@Service
public class JwtService {
    
    @Value("${jwt.secret}")
    private String secret;
    
    private SecretKey getSigningKey(){
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
    
    public Claims extractAllClaims(String token){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }   
    
    public UUID extractUserId(String token){
        return UUID.fromString(extractAllClaims(token).getSubject());
    }
    
    public String extractRole(String token){
        return extractAllClaims(token).get("role",String.class);
    }
    
    public boolean isTokenValid(String token){
        try{
            extractAllClaims(token);
            return true;
        }catch(Exception e){
            return false;
        }
    }
}
