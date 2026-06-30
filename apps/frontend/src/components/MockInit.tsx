"use client";
import { useEffect } from 'react';
import initMockFetch from '@/lib/mock/fetch-mock';

export default function MockInit() {
  useEffect(() => {
    initMockFetch();
  }, []);

  return null;
}
