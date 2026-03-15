'use client';

import { createChart, ColorType, AreaSeries, Time } from 'lightweight-charts';
import React, { useEffect, useRef } from 'react';

interface ChartComponentProps {
    data: { time: string | number; value: number }[];
    colors?: {
        backgroundColor?: string;
        lineColor?: string;
        textColor?: string;
        areaTopColor?: string;
        areaBottomColor?: string;
    };
}

export const ChartComponent = (props: ChartComponentProps) => {
    const {
        data,
        colors: {
            backgroundColor = 'transparent',
            lineColor = '#2962FF',
            textColor = 'white',
            areaTopColor = '#2962FF',
            areaBottomColor = 'rgba(41, 98, 255, 0.28)',
        } = {},
    } = props;

    const chartContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!chartContainerRef.current) return;

        const handleResize = () => {
            if (chartContainerRef.current) {
                chart.applyOptions({ width: chartContainerRef.current.clientWidth });
            }
        };

        const chart = createChart(chartContainerRef.current, {
            layout: {
                background: { type: ColorType.Solid, color: backgroundColor },
                textColor,
            },
            width: chartContainerRef.current.clientWidth,
            height: 450,
            grid: {
                vertLines: { visible: false },
                horzLines: { color: '#1a1a1a' },
            },
            rightPriceScale: {
                borderVisible: false,
                scaleMargins: {
                    top: 0.2, // Leave space for top UI
                    bottom: 0.1,
                },
            },
            timeScale: {
                borderVisible: false,
                timeVisible: true, // Enable time for intraday
                secondsVisible: false,
            },
        });

        chart.timeScale().fitContent();

        const newSeries = chart.addSeries(AreaSeries, {
            lineColor,
            topColor: areaTopColor,
            bottomColor: areaBottomColor,
            lineWidth: 2,
        });

        // Cast data to expected format for lightweight-charts
        // It expects Time (string | number) but TS might be strict
        newSeries.setData(data as { time: Time; value: number }[]);

        window.addEventListener('resize', handleResize);

        return () => {
            window.removeEventListener('resize', handleResize);
            chart.remove();
        };
    }, [data, backgroundColor, lineColor, textColor, areaTopColor, areaBottomColor]);

    return (
        <div
            ref={chartContainerRef}
            className="w-full h-full"
        />
    );
};
