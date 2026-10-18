<template>
  <view class="container">
    <view v-if="doc" class="card">
      <view class="article-title">{{ doc.title }}</view>
      <view class="article-meta">更新日期：{{ doc.updated }}</view>
      <view v-for="(section, idx) in doc.sections" :key="idx" class="agreement-section">
        <view class="agreement-heading">{{ section.title }}</view>
        <view class="article-content">{{ section.content }}</view>
      </view>
    </view>
    <view v-else class="empty">内容不存在</view>
  </view>
</template>

<script setup>
import { ref } from 'vue'
import Taro, { useLoad } from '@tarojs/taro'

const AGREEMENTS = {
  user: {
    title: '用户协议',
    updated: '2026-10-18',
    sections: [
      {
        title: '一、服务说明',
        content:
          '本系统用于毕业设计项目的演示与学习，提供账号登录、公告浏览、消息中心、个人资料管理等功能。使用本系统即表示你已阅读并同意本协议。'
      },
      {
        title: '二、账号与密码',
        content:
          '你应妥善保管账号与密码，不得将账号转借他人使用。首次登录后建议尽快修改默认密码，如发现账号异常请立即联系管理员。'
      },
      {
        title: '三、使用规范',
        content:
          '不得利用本系统发布违法违规、侵犯他人权益或干扰系统正常运行的内容。管理员有权对违规账号进行限制或删除处理。'
      },
      {
        title: '四、协议变更',
        content:
          '本协议可能随功能调整而更新，更新后会在系统内公布。继续使用本系统视为接受更新后的协议内容。'
      }
    ]
  },
  privacy: {
    title: '隐私政策',
    updated: '2026-10-18',
    sections: [
      {
        title: '一、我们收集的信息',
        content:
          '为了完成注册与登录，我们会收集你主动填写的用户名、昵称、邮箱、手机号等基础资料；头像等文件仅在你主动上传时保存。'
      },
      {
        title: '二、信息的使用',
        content:
          '收集的信息仅用于账号识别、个人资料展示、消息通知与系统安全审计，不会用于与本系统无关的商业用途。'
      },
      {
        title: '三、信息的存储与保护',
        content:
          '数据存储在本系统部署的服务器中，密码采用加密方式保存。我们会采取合理措施防止数据被未授权访问、泄露或篡改。'
      },
      {
        title: '四、你的权利',
        content:
          '你可以在个人中心查看和修改自己的资料；如需删除账号或导出数据，请联系管理员处理。'
      }
    ]
  }
}

const doc = ref(null)

useLoad((options) => {
  const type = options.type === 'privacy' ? 'privacy' : 'user'
  doc.value = AGREEMENTS[type]
  Taro.setNavigationBarTitle({ title: doc.value.title })
})
</script>

<style scoped lang="scss">
.agreement-section {
  margin-top: $space-lg;
}

.agreement-heading {
  margin-bottom: $space-sm;
  font-size: $font-md;
  font-weight: 600;
  color: $color-text;
}

.agreement-section:first-of-type {
  margin-top: $space-md;
}
</style>
