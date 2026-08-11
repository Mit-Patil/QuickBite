package com.quickbite.user_service.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
       
import javax.crypto.SecretKey;
import java.util.Date;
import java.util.UUID;

@Component
public class JwtService {
    
    @Value("${jwt.secret}")
    private String secret;
    
    @Value("${jwt.expiration-ms}")
    private long expirationMs;
    
    private SecretKey getSigningKey(){
        return Keys.hmacShaKeyFor(secret.getBytes());
    }
    
    public String generateToken(UUID userId,String email, String role){
        Date now = new Date();
        Date expiry = new Date(now.getTime() + expirationMs);
        
        return Jwts.builder()
                .subject(userId.toString())
                .claim("email", email)
                .claim("role", role)
                .issuedAt(now)
                .expiration(expiry)
                .signWith(getSigningKey())
                .compact();
    }
    
    public Claims extractClaims(String token){
        return Jwts.parser()
                .verifyWith(getSigningKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }
    
    public boolean isTokenValid(String token){
        try{
            extractClaims(token);
            return true;
        }catch(Exception e){
            return false;
        }
    }
    
}
