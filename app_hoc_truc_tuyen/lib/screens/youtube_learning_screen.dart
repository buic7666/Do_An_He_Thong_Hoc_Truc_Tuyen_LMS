import 'dart:async';

import 'package:flutter/material.dart';
import 'package:youtube_player_iframe/youtube_player_iframe.dart';

class YoutubeLearningScreen extends StatefulWidget {
  const YoutubeLearningScreen({
    super.key,
    required this.title,
    required this.videoUrl,
    this.startSeconds,
    this.endSeconds,
    this.onPositionChanged,
  });

  final String title;
  final String videoUrl;
  final double? startSeconds;
  final double? endSeconds;
  final ValueChanged<double>? onPositionChanged;

  @override
  State<YoutubeLearningScreen> createState() => _YoutubeLearningScreenState();
}

class _YoutubeLearningScreenState extends State<YoutubeLearningScreen> {
  YoutubePlayerController? _controller;
  String? _error;
  Timer? _positionTimer;

  @override
  void initState() {
    super.initState();

    final videoId = YoutubePlayerController.convertUrlToId(widget.videoUrl);

    if (videoId == null || videoId.isEmpty) {
      _error = 'Không đọc được link video YouTube.';
      return;
    }

    _controller = YoutubePlayerController.fromVideoId(
      videoId: videoId,
      autoPlay: true,
      startSeconds: widget.startSeconds,
      endSeconds: widget.endSeconds,
      params: const YoutubePlayerParams(
        showControls: true,
        showFullscreenButton: true,
        playsInline: true,
        enableCaption: true,
        strictRelatedVideos: true,
      ),
    );

    _positionTimer = Timer.periodic(const Duration(seconds: 5), (_) async {
      final controller = _controller;
      if (controller == null) return;

      try {
        final seconds = await controller.currentTime;
        widget.onPositionChanged?.call(seconds);
      } catch (_) {}
    });
  }

  @override
  void dispose() {
    _positionTimer?.cancel();
    _controller?.close();
    super.dispose();
  }

  Future<bool> _handleBack() async {
    double currentSeconds = widget.startSeconds ?? 0;

    try {
      currentSeconds = await _controller?.currentTime ?? currentSeconds;
    } catch (_) {}

    if (mounted) {
      Navigator.of(context).pop(currentSeconds);
    }

    return false;
  }

  @override
  Widget build(BuildContext context) {
    final controller = _controller;

    return WillPopScope(
      onWillPop: _handleBack,
      child: Scaffold(
        backgroundColor: const Color(0xFFF4F7FB),
        appBar: AppBar(
          leading: IconButton(
            icon: const Icon(Icons.arrow_back_rounded),
            onPressed: _handleBack,
          ),
          title: Text(
            widget.title,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          backgroundColor: Colors.white,
          foregroundColor: const Color(0xFF111827),
          elevation: 0,
        ),
        body: SafeArea(
          child: _error != null
              ? Center(
                  child: Padding(
                    padding: const EdgeInsets.all(24),
                    child: Text(
                      _error!,
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.red,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                )
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Container(
                      decoration: BoxDecoration(
                        color: Colors.black,
                        borderRadius: BorderRadius.circular(18),
                        boxShadow: [
                          BoxShadow(
                            color: Colors.black.withOpacity(0.18),
                            blurRadius: 24,
                            offset: const Offset(0, 12),
                          ),
                        ],
                      ),
                      clipBehavior: Clip.antiAlias,
                      child: YoutubePlayer(
                        controller: controller!,
                        aspectRatio: 16 / 9,
                      ),
                    ),
                    const SizedBox(height: 18),
                    Container(
                      padding: const EdgeInsets.all(18),
                      decoration: BoxDecoration(
                        color: Colors.white,
                        borderRadius: BorderRadius.circular(18),
                        border: Border.all(color: const Color(0xFFE5E7EB)),
                      ),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Đang học video',
                            style: TextStyle(
                              fontSize: 14,
                              color: Color(0xFF2563EB),
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 8),
                          Text(
                            widget.title,
                            style: const TextStyle(
                              fontSize: 20,
                              height: 1.35,
                              fontWeight: FontWeight.w800,
                              color: Color(0xFF111827),
                            ),
                          ),
                          const SizedBox(height: 10),
                          Text(
                            widget.startSeconds != null
                                ? 'Video được mở ngay trong app, bắt đầu từ ${widget.startSeconds!.toStringAsFixed(0)} giây.'
                                : 'Video được mở ngay trong app, không chuyển sang YouTube.',
                            style: const TextStyle(
                              color: Color(0xFF6B7280),
                              height: 1.45,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
        ),
      ),
    );
  }
}
