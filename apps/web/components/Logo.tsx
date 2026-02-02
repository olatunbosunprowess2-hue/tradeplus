import React from 'react';

interface LogoProps {
    className?: string;
    size?: number;
}

export const Logo: React.FC<LogoProps> = ({ className = '', size = 48 }) => {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 512 512"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
        >
            <defs>
                <linearGradient id="logo-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#2563EB" />
                    <stop offset="100%" stopColor="#0891B2" />
                </linearGradient>
                <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur in="SourceAlpha" stdDeviation="15" />
                    <feOffset dx="0" dy="10" result="offsetblur" />
                    <feComponentTransfer>
                        <feFuncA type="linear" slope="0.2" />
                    </feComponentTransfer>
                    <feMerge>
                        <feMergeNode />
                        <feMergeNode in="SourceGraphic" />
                    </feMerge>
                </filter>
            </defs>

            <g filter="url(#shadow)">
                {/* Top Hand - Clasping Motion */}
                <path
                    d="M380 140C340 100 280 90 230 100C180 110 130 140 100 180C95 185 95 195 100 200C105 205 115 205 120 200C145 170 185 145 235 135C285 125 330 135 365 170C400 205 415 250 415 300C415 330 405 360 390 385C385 395 388 405 396 410C404 415 415 412 420 403C440 370 450 335 450 300C450 240 430 190 380 140Z"
                    fill="url(#logo-gradient)"
                />
                {/* Palm Dot */}
                <circle cx="395" cy="300" r="15" fill="url(#logo-gradient)" />

                {/* Bottom Hand - Clasping Motion */}
                <path
                    d="M132 372C172 412 232 422 282 412C332 402 382 372 412 332C417 327 417 317 412 312C407 307 397 307 392 312C367 342 327 367 277 377C227 387 182 377 147 342C112 307 97 262 97 212C97 182 107 152 122 127C127 117 124 107 116 102C108 97 97 100 92 109C72 142 62 177 62 212C62 272 82 322 132 372Z"
                    fill="url(#logo-gradient)"
                />
                {/* Palm Dot */}
                <circle cx="117" cy="212" r="15" fill="url(#logo-gradient)" />
            </g>
        </svg>
    );
};
